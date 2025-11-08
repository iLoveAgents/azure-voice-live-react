import { useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig , createAudioDataCallback } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function VoiceAdvanced(): JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);

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
      await connect();
      await startCapture();
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async (): Promise<void> => {
    await stopCapture();
    disconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - Advanced Config</h1>
      <p>Status: {connectionState}</p>

      <div className="button-group">
        <button onClick={handleStart} disabled={isConnected}>
          Start
        </button>
        <button onClick={handleStop} disabled={!isConnected}>
          Stop
        </button>
      </div>

      <div className="config-panel">
        <h3>Configuration</h3>
        <ul className="config-list">
          <li><strong>Voice:</strong> HD Voice (en-US-Ava:DragonHDLatestNeural) with temperature 0.9, rate 1.1x</li>
          <li><strong>Turn Detection:</strong> Azure Semantic VAD with filler word removal</li>
          <li><strong>Barge-in:</strong> Enabled with auto-truncate</li>
          <li><strong>Audio Quality:</strong> 24kHz with echo cancellation and deep noise suppression</li>
          <li><strong>Temperature:</strong> 0.8 (creative responses)</li>
        </ul>
      </div>

      <audio ref={audioRef} autoPlay hidden />
    </div>
  );
}
