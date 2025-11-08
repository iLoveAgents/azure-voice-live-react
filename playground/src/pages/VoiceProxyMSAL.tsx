import { useRef, useEffect, useState } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig , createAudioDataCallback } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

export function VoiceProxyMSAL() {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { instance, accounts } = useMsal();

  const acquireToken = async () => {
    if (accounts.length === 0) {
      try {
        setAuthError(null);
        await instance.loginPopup({
          scopes: ['https://cognitiveservices.azure.com/.default'],
        });
      } catch (error) {
        console.error('Sign-in error:', error);
        setAuthError(`Sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    try {
      setAuthError(null);
      const response = await instance.acquireTokenSilent({
        scopes: ['https://cognitiveservices.azure.com/.default'],
        account: accounts[0],
      });
      setAccessToken(response.accessToken);
      setWsUrl(`ws://localhost:8080/ws?mode=standard&model=gpt-realtime&token=${encodeURIComponent(response.accessToken)}`);
      console.log('Access token acquired successfully');
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const response = await instance.acquireTokenPopup({
            scopes: ['https://cognitiveservices.azure.com/.default'],
            account: accounts[0],
          });
          setAccessToken(response.accessToken);
          setWsUrl(`ws://localhost:8080/ws?mode=standard&model=gpt-realtime&token=${encodeURIComponent(response.accessToken)}`);
          console.log('Access token acquired via popup');
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

  useEffect(() => {
    if (accounts.length > 0 && !accessToken) {
      acquireToken();
    }
  }, [accounts]);

  const config = createVoiceLiveConfig({
    connection: {
      proxyUrl: wsUrl || undefined,
    },
    session: {
      instructions: 'You are a helpful assistant. Keep responses brief.',
    },
  });

  const { connect, disconnect, connectionState, sendEvent, audioStream } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: createAudioDataCallback(sendEvent),
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

  const handleSignOut = () => {
    instance.logoutPopup();
    setAccessToken(null);
    setWsUrl(null);
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - Secure Proxy (MSAL)</h1>

      {accounts.length === 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <p>Not signed in</p>
          <button onClick={acquireToken}>Sign In</button>
        </div>
      ) : (
        <div style={{ marginBottom: '1rem' }}>
          <p>Signed in as: {accounts[0].username}</p>
          <p>Token: {accessToken ? '✓' : '✗'}</p>
          <button onClick={handleSignOut} style={{ marginBottom: '0.5rem' }}>Sign Out</button>
        </div>
      )}

      {authError && <p style={{ color: '#c62828' }}>{authError}</p>}
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected || !wsUrl}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
}
