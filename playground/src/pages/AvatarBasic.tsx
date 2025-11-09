import { useRef, useEffect, useState } from 'react';
import { useVoiceLive, createVoiceLiveConfig, withAvatar } from '@iloveagents/azure-voice-live-react';
import { SampleLayout, StatusBadge, Section, ControlGroup, ErrorPanel } from '../components';

export function AvatarBasic() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

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

  const { connect, disconnect, connectionState, videoStream, audioStream } = useVoiceLive(config);

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
      setError(null);
      await connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
      console.error('Start error:', err);
    }
  };

  const handleStop = () => {
    disconnect();
    setError(null);
  };

  const isConnected = connectionState === 'connected';

  return (
    <SampleLayout
      title="Basic Avatar"
      description="Simple avatar with video stream rendering. Character: lisa, style: casual-sitting."
    >
      <ErrorPanel error={error} />

      <StatusBadge status={connectionState} />

      <ControlGroup>
        <button onClick={handleStart} disabled={isConnected}>
          Start Avatar
        </button>
        <button onClick={handleStop} disabled={!isConnected}>
          Stop
        </button>
      </ControlGroup>

      <Section>
        <div style={{
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              maxWidth: '600px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: '#000'
            }}
          />
        </div>
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </Section>
    </SampleLayout>
  );
}
