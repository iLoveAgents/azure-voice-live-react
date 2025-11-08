import { useCallback, useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

/**
 * VoiceOnlyBasic - Simple voice chat example
 * 
 * Demonstrates basic voice-only conversation with Azure Voice Live API.
 * Audio capture automatically starts when the session is ready.
 */
export function VoiceOnlyBasic(): JSX.Element {
  // Create Voice Live configuration with default preset
  const config = createVoiceLiveConfig('default', {
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    }
  });

  // Voice Live hook for managing WebSocket connection and audio streaming
  const { connect, disconnect, connectionState, sendEvent, audioStream, isReady } = useVoiceLive(config);

  // Audio capture hook for microphone input (24kHz PCM16)
  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      // Convert audio buffer to base64 and send to Voice Live API
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  // Refs for audio playback and capture state management
  const audioRef = useRef<HTMLAudioElement>(null);
  const captureStartedRef = useRef(false);

  // Set up audio playback when stream becomes available
  useEffect(() => {
    if (audioRef.current && audioStream) {
      audioRef.current.srcObject = audioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [audioStream]);

  /**
   * Automatically start audio capture when session is ready.
   * This ensures audio is only sent after session configuration is complete.
   */
  useEffect(() => {
    if (isReady && !captureStartedRef.current) {
      captureStartedRef.current = true;
      startCapture()
        .then(() => {
          console.log('Mic started (session ready)');
        })
        .catch(console.error);
    }
  }, [isReady, startCapture]);

  const handleStart = async (): Promise<void> => {
    console.log('Starting...');
    try {
      await connect();
      console.log('Connected - waiting for session to be ready...');
      // Audio capture will start automatically when isReady becomes true
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handleStop = async (): Promise<void> => {
    captureStartedRef.current = false;
    await stopCapture();
    disconnect();
  };

  const isConnected = connectionState === 'connected';

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Voice Chat - Simple</h1>
      <p>Status: {connectionState}</p>
      <div>
        <button onClick={handleStart} disabled={isConnected}>Start</button>
        <button onClick={handleStop} disabled={!isConnected}>Stop</button>
      </div>
      {/* Hidden audio element for playing assistant responses */}
      <audio ref={audioRef} autoPlay hidden />
    </div>
  );
}
