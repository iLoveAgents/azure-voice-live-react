import { useState } from 'react';
import { useVoiceLive, VoiceLiveAvatar, createVoiceLiveConfig, withTransparentBackground } from '@iloveagents/azure-voice-live-react';
import { SampleLayout, StatusBadge, Section, ControlGroup, ConfigPanel, ConfigItem, ErrorPanel } from '../components';

export function AvatarAdvanced() {
  const [error, setError] = useState<string | null>(null);

  const config = createVoiceLiveConfig({
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: withTransparentBackground({
      avatar: {
        character: 'lisa',
        style: 'casual-sitting',
        video: {
          codec: 'h264',
          resolution: { width: 1920, height: 1080 },
          bitrate: 2000000,
        },
      },
      voice: {
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: 0.9,
        rate: '0.95',
      },
      turnDetection: {
        type: 'azure_semantic_vad',
        interruptResponse: true,
        autoTruncate: true,
        removeFillerWords: true,
        createResponse: true,
      },
      inputAudioNoiseReduction: {
        type: 'azure_deep_noise_suppression',
      },
      inputAudioEchoCancellation: {
        type: 'server_echo_cancellation',
      },
    })
  });

  // Voice Live hook - mic capture is integrated and auto-starts!
  const { connect, disconnect, connectionState, videoStream, audioStream } = useVoiceLive(config);

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

  return (
    <SampleLayout
      title="Advanced Avatar"
      description="High-resolution avatar with transparent background removal (chroma key), semantic VAD, barge-in, and advanced audio processing."
    >
      <ErrorPanel error={error} />

      <StatusBadge status={connectionState} />

      <Section>
        <ControlGroup>
          <button onClick={handleStart} disabled={connectionState === 'connected'}>
            Start Avatar
          </button>
          <button onClick={handleStop} disabled={connectionState !== 'connected'}>
            Stop
          </button>
        </ControlGroup>
      </Section>

      <ConfigPanel title="Advanced Configuration">
        <ConfigItem label="Resolution" value="1920x1080 (Full HD)" />
        <ConfigItem label="Bitrate" value="2 Mbps" />
        <ConfigItem label="Background" value="Transparent (Chroma Key)" />
        <ConfigItem label="Voice" value="en-US-Ava:DragonHDLatestNeural" />
        <ConfigItem label="Voice Temperature" value="0.9" />
        <ConfigItem label="Voice Rate" value="0.95x" />
        <ConfigItem label="Turn Detection" value="Azure Semantic VAD" />
        <ConfigItem label="Barge-in" value="Enabled with auto-truncate" />
        <ConfigItem label="Filler Word Removal" value="Enabled" />
        <ConfigItem label="Noise Suppression" value="Azure Deep Noise Suppression" />
        <ConfigItem label="Echo Cancellation" value="Server-side" />
      </ConfigPanel>

      <Section title="Avatar Video (Transparent Background)">
        <div style={{
          width: '100%',
          maxWidth: '800px',
          height: '450px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          overflow: 'hidden',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {videoStream ? (
            <VoiceLiveAvatar
              videoStream={videoStream}
              audioStream={audioStream}
              enableChromaKey
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <p style={{ color: 'white', fontSize: '14px' }}>Avatar will appear here when connected</p>
          )}
        </div>
      </Section>

      <Section>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Features Demonstrated</h3>
        <ul style={{ fontSize: '14px', color: '#666', lineHeight: '1.8', marginLeft: '20px' }}>
          <li><strong>VoiceLiveAvatar Component:</strong> Specialized UI wrapper for avatar rendering</li>
          <li><strong>Chroma Key Background Removal:</strong> Transparent background for custom styling</li>
          <li><strong>High-Resolution Video:</strong> Full HD (1920x1080) at 2Mbps bitrate</li>
          <li><strong>Azure Semantic VAD:</strong> Advanced voice activity detection</li>
          <li><strong>Custom Background:</strong> Gradient background showing transparency</li>
        </ul>
      </Section>
    </SampleLayout>
  );
}
