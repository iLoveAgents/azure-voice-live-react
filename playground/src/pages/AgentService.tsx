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

  // Check if MSAL is configured
  const msalConfigured =
    import.meta.env.VITE_AZURE_CLIENT_ID &&
    import.meta.env.VITE_AZURE_CLIENT_ID !== '00000000-0000-0000-0000-000000000000';

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
        type: 'azure-standard',
        rate: 0.9  // Slightly slower for more natural speech
      },
      inputAudioFormat: 'pcm16',
      outputAudioFormat: 'pcm16',
      inputAudioTranscription: { model: 'whisper-1' },
      turnDetection: {
        type: 'azure_semantic_vad',
        threshold: 0.6,  // Higher threshold = less sensitive
        prefixPaddingMs: 300,
        speechDurationMs: 100,  // Minimum speech duration
        silenceDurationMs: 700,  // Longer silence before turn ends
        removeFillerWords: true,
        interruptResponse: true,
        createResponse: true
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

      {/* Configuration Error */}
      {!msalConfigured && (
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '4px' }}>
          <h3 style={{ marginTop: 0 }}>MSAL Configuration Missing</h3>
          <p>Please configure the following environment variables in your <code>.env</code> file:</p>
          <ul>
            <li><code>VITE_AZURE_CLIENT_ID</code> - Your Azure AD application (client) ID</li>
            <li><code>VITE_AZURE_TENANT_ID</code> - Your Azure AD tenant ID</li>
          </ul>
          <p>See the <a href="https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app" target="_blank" rel="noopener noreferrer">Azure documentation</a> for how to register an application.</p>
        </div>
      )}

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
          Status: {connectionState}
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
