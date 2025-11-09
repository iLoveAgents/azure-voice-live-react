import { useRef, useEffect } from 'react';
import { useVoiceLive, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function VoiceProxy() {
  const config = createVoiceLiveConfig({
    connection: {
      // Proxy mode: API key secured in backend
      proxyUrl: 'ws://localhost:8080/ws?mode=standard&model=gpt-realtime',
    }
  });

  // Voice Live hook - mic capture is integrated and auto-starts!
  const { connect, disconnect, connectionState, audioStream } = useVoiceLive(config);

  const audioRef = useRef<HTMLAudioElement>(null);

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
      console.log('Connected - mic will auto-start when session ready');
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = () => {
    disconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - Secure Proxy (API Key)</h1>
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
    </div>
  );
}
