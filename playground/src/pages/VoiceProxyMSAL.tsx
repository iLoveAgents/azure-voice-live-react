import { useCallback, useRef, useEffect, useState } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';
// import { useMsal } from '@azure/msal-react'; // Uncomment when MSAL is configured

/**
 * Voice Chat with MSAL Token Authentication (Enterprise/User-level Auth)
 *
 * This example demonstrates using Azure Entra ID (MSAL) authentication
 * instead of API keys. Benefits:
 * - ✅ No API keys stored anywhere
 * - ✅ User-level authentication and auditing
 * - ✅ Enterprise SSO integration
 * - ✅ Tokens auto-expire (security)
 * - ✅ Works with Conditional Access policies
 *
 * Setup required:
 * 1. Azure App Registration with scope: https://cognitiveservices.azure.com/.default
 * 2. Assign "Cognitive Services User" role on AI Foundry resource
 * 3. Install @azure/msal-react and configure MsalProvider
 */
export function VoiceProxyMSAL() {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Uncomment this when MSAL is configured:
  /*
  const { instance, accounts } = useMsal();

  useEffect(() => {
    async function getToken() {
      try {
        if (!accounts || accounts.length === 0) {
          setAuthError('No user signed in. Please sign in first.');
          return;
        }

        const account = accounts[0];
        const response = await instance.acquireTokenSilent({
          scopes: ['https://cognitiveservices.azure.com/.default'],
          account,
        });

        setWsUrl(
          `ws://localhost:8080?mode=standard&model=gpt-realtime&token=${response.accessToken}`
        );
        setAuthError(null);
      } catch (error) {
        console.error('Token acquisition failed:', error);
        setAuthError('Failed to acquire token. Please sign in again.');
      }
    }

    getToken();
  }, [instance, accounts]);
  */

  // DEMO MODE: For testing without MSAL setup
  // Remove this and uncomment the MSAL code above for production
  useEffect(() => {
    setAuthError('MSAL not configured. This is a demo showing the implementation pattern.');
    // In production, this URL would include a real MSAL token
    setWsUrl('ws://localhost:8080?mode=standard&model=gpt-realtime');
  }, []);

  const config = createVoiceLiveConfig('default', {
    connection: {
      customWebSocketUrl: wsUrl || undefined,
    },
    session: {
      instructions: 'You are a helpful assistant. Keep responses brief.',
    },
  });

  const { connect, disconnect, connectionState, sendEvent, audioStream } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
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

  const handleStart = async () => {
    if (!wsUrl) {
      alert('Waiting for authentication token...');
      return;
    }

    console.log('Starting...');
    try {
      await connect();
      console.log('Connected');
      await startCapture();
      console.log('Mic started');
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async () => {
    await stopCapture();
    disconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - MSAL Token Auth</h1>

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
        <h3 style={{ marginTop: 0 }}>⚠️ Enterprise Authentication Setup</h3>
        <p><strong>This example requires Azure Entra ID (MSAL) configuration.</strong></p>
        <p>Status: {authError || 'Token acquired'}</p>

        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Setup Instructions</summary>
          <ol style={{ marginLeft: '1.5rem' }}>
            <li>Create Azure App Registration in Entra ID</li>
            <li>Add API permission: <code>https://cognitiveservices.azure.com/.default</code></li>
            <li>Assign "Cognitive Services User" role to users on AI Foundry resource</li>
            <li>Install: <code>npm install @azure/msal-react @azure/msal-browser</code></li>
            <li>Wrap app with <code>&lt;MsalProvider&gt;</code></li>
            <li>Uncomment MSAL code in this component</li>
          </ol>
        </details>
      </div>

      <p>
        <strong>Production-ready:</strong> User-level authentication with Azure Entra ID.
        <br />
        No API keys needed. Perfect for enterprise deployments.
      </p>
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected || !wsUrl}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ol>
          <li>User signs in with Azure Entra ID (MSAL)</li>
          <li>Browser acquires token with scope: <code>cognitiveservices.azure.com/.default</code></li>
          <li>Browser passes token to proxy: <code>ws://localhost:8080?token=MSAL_TOKEN</code></li>
          <li>Proxy adds Authorization header: <code>Bearer TOKEN</code></li>
          <li>Azure validates token and grants access</li>
        </ol>

        <h3>Benefits vs API Key:</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#e9ecef' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #dee2e6' }}>Feature</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #dee2e6' }}>API Key</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid #dee2e6' }}>MSAL Token</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Security</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>🟡 Shared key</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>✅ User-specific</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Auditing</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>❌ Anonymous</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>✅ Per-user logs</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Expiration</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>❌ Manual rotation</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>✅ Auto-expires (1hr)</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>SSO</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>❌ Not supported</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>✅ Enterprise SSO</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>Conditional Access</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>❌ Not supported</td>
              <td style={{ padding: '0.5rem', border: '1px solid #dee2e6' }}>✅ Full support</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
