import { useRef, useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useVoiceLive, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';

export default function AgentServiceProxy(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const backendProxyUrl = import.meta.env.VITE_BACKEND_PROXY_URL || 'ws://localhost:8080';

  // Acquire access token for Agent Service
  const acquireToken = async () => {
    if (accounts.length === 0) {
      // No user signed in - initiate sign-in
      try {
        setAuthError(null);
        await instance.loginPopup({
          scopes: ['https://ai.azure.com/.default'],
        });
      } catch (error) {
        console.error('Sign-in error:', error);
        setAuthError(`Sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    // User is signed in - acquire token silently
    try {
      setAuthError(null);
      const response = await instance.acquireTokenSilent({
        scopes: ['https://ai.azure.com/.default'],
        account: accounts[0],
      });
      setAccessToken(response.accessToken);
      console.log('Access token acquired successfully with Azure AI scope');
    } catch (error) {
      // Token acquisition failed - may need interactive authentication
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const response = await instance.acquireTokenPopup({
            scopes: ['https://ai.azure.com/.default'],
            account: accounts[0],
          });
          setAccessToken(response.accessToken);
          console.log('Access token acquired via popup with Azure AI scope');
        } catch (popupError) {
          console.error('Token acquisition failed:', popupError);
          setAuthError(`Authentication failed: ${popupError instanceof Error ? popupError.message : String(popupError)}`);
        }
      } else {
        console.error('Token acquisition error:', error);
        setAuthError(`Token error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  // Auto-acquire token on mount and when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !accessToken) {
      acquireToken();
    }
  }, [accounts]);

  // Build proxy URL with token
  const proxyUrl = accessToken
    ? `${backendProxyUrl}/ws?mode=agent&token=${encodeURIComponent(accessToken)}`
    : null;

  // Configure Voice Live with proxy
  const config = proxyUrl ? createVoiceLiveConfig({
    connection: {
      proxyUrl,
    },
    session: {
      modalities: ['text', 'audio'],
      voice: {
        name: 'en-US-AvaMultilingualNeural',
        type: 'azure-standard'
      },
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      inputAudioTranscription: { model: 'whisper-1' },
      turnDetection: {
        type: 'server_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 500
      }
    },
    onEvent: (event) => {
      // Log transcriptions and agent responses
      if (event.type === 'conversation.item.input_audio_transcription.completed') {
        console.log(`[Agent] You: "${event.transcript}"`);
      } else if (event.type === 'response.audio_transcript.done') {
        console.log(`[Agent] Agent: "${event.transcript}"`);
      } else if (event.type === 'error') {
        console.error('[Agent] Error:', event);
        setAuthError(`Azure Error: ${event.error?.message || event.error?.code || 'Unknown error'}`);
      }
    }
  }) : null;

  // Voice Live hook with integrated microphone and interruption handling
  const { connect, disconnect, connectionState, audioStream } = useVoiceLive(config || {
    connection: { proxyUrl: '' }
  });

  // Setup audio element
  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async (): Promise<void> => {
    if (!accessToken) {
      setAuthError('Please sign in first');
      return;
    }

    try {
      setAuthError(null);
      await connect();
      console.log('[Agent] Connected - microphone will auto-start when session ready');
    } catch (err) {
      console.error('[Agent] Start error:', err);
      setAuthError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStop = (): void => {
    disconnect();
  };

  const handleSignOut = () => {
    instance.logoutPopup();
    setAccessToken(null);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Agent Service with Backend Proxy</h1>

      {/* Authentication Status */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Authentication Status</h3>
        {accounts.length === 0 ? (
          <>
            <p>Not signed in</p>
            <button onClick={acquireToken}>Sign In</button>
          </>
        ) : (
          <>
            <p>Signed in as: <strong>{accounts[0].username}</strong></p>
            <p>Access token: {accessToken ? '✓ Acquired' : '✗ Not available'}</p>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        )}
        {authError && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
            {authError}
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={handleStart}
          disabled={connectionState === 'connected' || !accessToken}
          style={{ marginRight: '1rem' }}
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={connectionState === 'disconnected'}
        >
          Stop
        </button>
        <div style={{ marginTop: '0.5rem' }}>
          {connectionState} {isCapturing && '(mic)'}
        </div>
      </div>

      {/* Architecture Diagram */}
      <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Architecture</h3>
        <div style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
          Browser (MSAL) → Backend Proxy (Node.js) → Azure Voice Live Agent Service
          <br />
          <span style={{ opacity: 0.7 }}>Token acquired via MSAL, sent to proxy, proxy adds Authorization header</span>
        </div>
      </div>

      {/* Setup Instructions */}
      <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Setup Instructions</h3>
        <ol>
          <li>Ensure your backend proxy server is running</li>
          <li>Configure Azure AD app with appropriate scopes</li>
          <li>Sign in and click "Start"</li>
        </ol>
        <p style={{ marginTop: '1rem' }}>
          <strong>Backend URL:</strong> {backendProxyUrl}
        </p>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
