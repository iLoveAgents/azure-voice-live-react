import { useRef, useEffect, useState } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig , createAudioDataCallback } from '@iloveagents/azure-voice-live-react';
import { SampleLayout, StatusBadge, Section, ControlGroup, ConfigPanel, ConfigItem, ErrorPanel } from '../components';

export function VoiceAdvanced(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Advanced configuration with all major options
  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: {
      instructions: 'You are a helpful assistant. Keep responses brief and friendly.',
      temperature: 0.8,

      // Voice configuration
      voice: {
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: 0.9,
        rate: '1.1',
      },

      // Advanced turn detection with Azure Semantic VAD
      turnDetection: {
        type: 'azure_semantic_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        silenceDurationMs: 500,
        removeFillerWords: true, // Remove "um", "uh", etc.
        interruptResponse: true,  // Enable barge-in
        autoTruncate: true,       // Auto-truncate on interrupt
        createResponse: true,
      },

      // Input audio enhancements
      inputAudioSamplingRate: 24000,
      inputAudioEchoCancellation: {
        type: 'server_echo_cancellation',
      },
      inputAudioNoiseReduction: {
        type: 'azure_deep_noise_suppression',
      },
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

  const handleStart = async (): Promise<void> => {
    try {
      setError(null);
      await connect();
      await startCapture();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start';
      setError(message);
      console.error('Start error:', err);
    }
  };

  const handleStop = async (): Promise<void> => {
    await stopCapture();
    disconnect();
    setError(null);
  };

  const isConnected = connectionState === 'connected';

  return (
    <SampleLayout
      title="Advanced Voice Chat"
      description="Advanced VAD configuration with echo cancellation, noise suppression, filler word removal, and barge-in support."
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

      <ConfigPanel title="Active Configuration">
        <ConfigItem label="Voice" value="en-US-Ava:DragonHDLatestNeural (HD)" />
        <ConfigItem label="Voice Temperature" value="0.9" />
        <ConfigItem label="Voice Rate" value="1.1x" />
        <ConfigItem label="Turn Detection" value="Azure Semantic VAD" />
        <ConfigItem label="Filler Word Removal" value="Enabled (removes 'um', 'uh', etc.)" />
        <ConfigItem label="Barge-in" value="Enabled with auto-truncate" />
        <ConfigItem label="Audio Sampling" value="24kHz" />
        <ConfigItem label="Echo Cancellation" value="Server-side" />
        <ConfigItem label="Noise Suppression" value="Azure Deep Noise Suppression" />
        <ConfigItem label="Response Temperature" value="0.8" />
      </ConfigPanel>

      <Section>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Features Demonstrated</h3>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>Azure Semantic VAD:</strong> Advanced voice activity detection with semantic understanding</li>
          <li><strong>Filler Word Removal:</strong> Automatically removes hesitation sounds for cleaner input</li>
          <li><strong>Barge-in Support:</strong> Interrupt the assistant mid-response with auto-truncation</li>
          <li><strong>High-Quality Audio:</strong> 24kHz sampling with echo cancellation and deep noise suppression</li>
          <li><strong>Manual Audio Capture:</strong> Direct control over microphone with useAudioCapture hook</li>
        </ul>
      </Section>

      <audio ref={audioRef} autoPlay hidden />
    </SampleLayout>
  );
}
