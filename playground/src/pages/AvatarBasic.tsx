import { useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig, withAvatar , createAudioDataCallback } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function AvatarBasic() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: withAvatar('lisa', 'casual-sitting', {
      codec: 'h264',
    }, {
      instructions: 'You are a helpful assistant. Keep responses brief.',
      voice: {
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
      },
    }),
  });

  const { connect, disconnect, connectionState, sendEvent, videoStream, audioStream } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: createAudioDataCallback(sendEvent),
  });

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
    try {
      await connect();
      await startCapture();
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
      <h1>Avatar - Simple</h1>
      <p>Status: {connectionState}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleStart} disabled={isConnected}>
          Start
        </button>
        <button onClick={handleStop} disabled={!isConnected}>
          Stop
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: '600px',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}
        />
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </div>
    </div>
  );
}
