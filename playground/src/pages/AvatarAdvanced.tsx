import { useCallback } from 'react';
import { useVoiceLive, useAudioCapture, AvatarDisplay, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function AvatarAdvanced() {
  const config = createVoiceLiveConfig('default', {
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: {
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
    }
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

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Avatar - Advanced Config</h1>
      <p>Status: {connectionState}</p>

      <div style={{ width: '800px', height: '450px', background: '#000', marginTop: '20px', borderRadius: '8px', overflow: 'hidden' }}>
        {videoStream && <AvatarDisplay videoStream={videoStream} audioStream={audioStream} style={{ width: '100%', height: '100%' }} />}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleStart} disabled={connectionState === 'connected'}>Start</button>
        <button onClick={handleStop} disabled={connectionState !== 'connected'}>Stop</button>
      </div>
    </div>
  );
}
