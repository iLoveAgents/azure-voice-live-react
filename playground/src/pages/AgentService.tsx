import { useRef, useEffect, useCallback, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useVoiceLive, useAudioCapture, AvatarDisplay } from '@iloveagents/azure-voice-live-react';

export default function AgentService(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { instance, accounts } = useMsal();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const resourceName = import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE;
  const agentId = import.meta.env.VITE_AGENT_ID;
  const projectName = import.meta.env.VITE_PROJECT_NAME;

  // Validate all required environment variables
  if (!resourceName || !agentId || !projectName) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
        <h1>Agent Service</h1>
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '1rem', marginTop: '1rem' }}>
          <strong>Configuration Required</strong>
          <p>Please set all required environment variables in your .env file:</p>
          <ul>
            <li>VITE_AZURE_AI_FOUNDRY_RESOURCE=your-resource-name</li>
            <li>VITE_AGENT_ID=your-agent-id</li>
            <li>VITE_PROJECT_NAME=your-project-name</li>
            <li>VITE_AZURE_CLIENT_ID=your-azure-app-client-id</li>
            <li>VITE_AZURE_TENANT_ID=your-azure-tenant-id</li>
          </ul>
          <p style={{ marginTop: '1rem' }}>
            <strong>Note:</strong> Agent Service requires user authentication via MSAL.
            You need to register an Azure AD application and configure the client ID and tenant ID.
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
            See .env.example for setup instructions.
          </p>
        </div>
      </div>
    );
  }

  // Agent Service configuration with MSAL token
  // Note: API key is NOT supported in Agent mode - only agent-access-token
  const config = accessToken ? {
    connection: {
      resourceName,
      agentId,
      projectName,
      agentAccessToken: accessToken,
    },
  } : null;

  const { connect, disconnect, connectionState, sendEvent, videoStream, audioStream } = useVoiceLive(config || {
    connection: { resourceName, agentId, projectName, agentAccessToken: '' }
  });

  const { startCapture, stopCapture, isCapturing } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

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

  const handleStart = async (): Promise<void> => {
    if (!accessToken) {
      await acquireToken();
      return;
    }

    console.log('Starting Agent Service connection...');
    try {
      await connect();
      console.log('Connected to Agent Service');
      await startCapture();
      console.log('Mic started');
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async (): Promise<void> => {
    await stopCapture();
    disconnect();
  };

  const handleSignOut = () => {
    instance.logoutPopup();
    setAccessToken(null);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Agent Service with MSAL Authentication</h1>

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
            <p>Access token: {accessToken ? '✓ Acquired' : '✗ Not acquired'}</p>
            <button onClick={handleSignOut}>Sign Out</button>
          </>
        )}
        {authError && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#ffebee', borderRadius: '4px', color: '#c62828' }}>
            {authError}
          </div>
        )}
      </div>

      {/* Voice Live Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={handleStart} disabled={connectionState !== 'disconnected' || !accessToken}>
          Start
        </button>
        <button onClick={handleStop} disabled={connectionState === 'disconnected'}>
          Stop
        </button>
        <div>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            display: 'inline-block',
            marginRight: '0.5rem',
            background: connectionState === 'connected' ? '#4caf50' : connectionState === 'connecting' ? '#ff9800' : '#9e9e9e'
          }} />
          {connectionState} {isCapturing && '(mic)'}
        </div>
      </div>

      {/* Avatar Display */}
      {videoStream && (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <AvatarDisplay
            videoStream={videoStream}
            audioStream={audioStream}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        </div>
      )}

      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      {/* Setup Instructions */}
      <div style={{ marginTop: '3rem', padding: '1rem', background: '#e3f2fd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: 0 }}>Setup Instructions</h3>
        <ol>
          <li>Register an Azure AD application in Azure Portal</li>
          <li>Configure redirect URI: <code>http://localhost:3001</code></li>
          <li>Grant API permissions: <code>https://ai.azure.com/.default</code></li>
          <li>Copy Client ID and Tenant ID to your .env file</li>
          <li>Wrap your app with MsalProvider (see App.tsx)</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.9em' }}>
          <strong>Documentation:</strong> See <a href="https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-agents-quickstart" target="_blank" rel="noopener noreferrer">Voice Live Agent Service Quickstart</a>
        </p>
      </div>
    </div>
  );
}
