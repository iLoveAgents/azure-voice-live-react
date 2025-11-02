import { useCallback, useRef, useEffect } from 'react';
import { useVoiceLive, useAudioCapture, createVoiceLiveConfig } from '@iloveagents/azure-voice-live-react';
import { Link } from 'react-router-dom';

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const config = createVoiceLiveConfig('default', {
    connection: {
      resourceName: import.meta.env.VITE_AZURE_AI_FOUNDRY_RESOURCE,
      apiKey: import.meta.env.VITE_AZURE_SPEECH_KEY,
    },
    session: {
      instructions: 'You are a helpful assistant. Keep responses brief.',
    },
  });

  const { connect, disconnect, connectionState, sendEvent, audioStream, audioContext } = useVoiceLive(config);

  const { startCapture, stopCapture } = useAudioCapture({
    sampleRate: 24000,
    onAudioData: useCallback((audioData: ArrayBuffer) => {
      const uint8Array = new Uint8Array(audioData);
      const base64Audio = btoa(String.fromCharCode(...Array.from(uint8Array)));
      sendEvent({ type: 'input_audio_buffer.append', audio: base64Audio });
    }, [sendEvent]),
  });

  // Audio visualization
  useEffect(() => {
    if (!audioContext || !audioStream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create analyzer
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Connect audio stream to analyser
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);

    // Draw visualization
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0078d4';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      source.disconnect();
    };
  }, [audioContext, audioStream]);

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

  return (
    <div>
      <Link to="/">← Back</Link>
      <h1>Audio Visualizer</h1>
      <p>Status: {connectionState}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleStart} disabled={connectionState === 'connected'}>Start</button>
        <button onClick={handleStop} disabled={connectionState !== 'connected'}>Stop</button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Audio Waveform</h2>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#1e1e1e',
            width: '100%',
            maxWidth: '800px',
          }}
        />
      </div>
    </div>
  );
}
