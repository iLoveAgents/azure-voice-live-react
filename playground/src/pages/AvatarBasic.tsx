import { useCallback, useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig, withAvatar } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function AvatarBasic() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const config = createVoiceLiveConfig('default', {
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: withAvatar('lisa', 'casual-sitting', {}, {
      instructions: 'You are a helpful assistant. Keep responses brief.',
    }),
  });

  const { connect, disconnect, connectionState, sendEvent, videoStream } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
      videoRef.current.play().catch(console.error);
    }
  }, [videoStream]);

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
      </div>
    </div>
  );
}
