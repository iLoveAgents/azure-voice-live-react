import { useRef, useEffect, useState } from 'react';
import { useVoiceLive, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { SampleLayout, StatusBadge, Section, ControlGroup, ErrorPanel } from '../components';

/**
 * VoiceOnlyBasic - Simple voice chat example
 *
 * Demonstrates basic voice-only conversation with Azure Voice Live API.
 * Microphone automatically starts when the session is ready (autoStartMic: true by default).
 * No need to manually manage audio capture!
 */
export function VoiceOnlyBasic(): JSX.Element {
  const [error, setError] = useState<string | null>(null);

  // Create Voice Live configuration
  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    }
  });

  // Voice Live hook - mic capture is integrated and auto-starts!
  const { connect, disconnect, connectionState, audioStream } = useVoiceLive(config);

  // Ref for audio playback
  const audioRef = useRef<HTMLAudioElement>(null);

  // Set up audio playback when stream becomes available
  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  const handleStart = async (): Promise<void> => {
    try {
      setError(null);
      // Just connect - mic will auto-start when session is ready!
      await connect();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
      console.error('Start error:', err);
    }
  };

  const handleStop = (): void => {
    // Disconnect also stops the mic automatically
    disconnect();
    setError(null);
  };

  const isConnected = connectionState === 'connected';

  return (
    <SampleLayout
      title="Basic Voice Chat"
      description="Simple voice conversation with auto-start microphone and minimal configuration. Perfect for getting started!"
    >
      <ErrorPanel error={error} />

      <StatusBadge status={connectionState} />

      <Section>
        <ControlGroup>
          <button onClick={handleStart} disabled={isConnected}>
            Start Conversation
          </button>
          <button onClick={handleStop} disabled={!isConnected}>
            Stop
          </button>
        </ControlGroup>
      </Section>

      <Section>
        <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          Click "Start Conversation" to begin. The microphone will automatically start when the session is ready.
          Speak naturally and the AI assistant will respond with voice.
        </p>
      </Section>

      {/* Hidden audio element for playing assistant responses */}
      <audio ref={audioRef} autoPlay hidden />
    </SampleLayout>
  );
}
