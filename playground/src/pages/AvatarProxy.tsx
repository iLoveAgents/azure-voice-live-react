import { useCallback, useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function AvatarProxy() {
  const config = createVoiceLiveConfig('avatar', {
    connection: {
      // Proxy mode: just change the endpoint! API key secured in backend.
      customWebSocketUrl: 'ws://localhost:8080?mode=standard&model=gpt-realtime',
    },
    session: {
      voice: {
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
      },
      avatar: {
        character: import.meta.env.VITE_AVATAR_CHARACTER || 'lisa',
        style: import.meta.env.VITE_AVATAR_STYLE || 'casual-sitting',
      },
    },
  });

  const { connect, disconnect, connectionState, sendEvent, videoStream, audioStream } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(console.error);
    }
  }, [videoStream]);

  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async () => {
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
      <h1>Avatar - Secure Proxy</h1>
      <p>
        <strong>Production-ready:</strong> API key secured in backend proxy.
        <br />
        No credentials exposed to browser.
      </p>
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '100%', maxWidth: '512px', background: '#000' }}
      />
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ol>
          <li>Browser connects to backend proxy (no API key needed)</li>
          <li>Proxy adds API key from .env (secured server-side)</li>
          <li>Proxy forwards to Azure Voice Live</li>
        </ol>
        <p><strong>To switch to proxy:</strong> Just change <code>customWebSocketUrl</code> in connection config.</p>
      </div>
    </div>
  );
}
