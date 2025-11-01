/**
 * useAudioCapture Hook
 *
 * React hook for capturing and processing microphone audio using Web Audio API.
 * Handles microphone access, AudioContext setup, and AudioWorklet processing.
 *
 * Features:
 * - Automatic microphone permission handling
 * - AudioWorklet-based audio processing
 * - Pause/resume capability
 * - Proper cleanup on unmount
 * - PCM16 audio output at configurable sample rate
 *
 * @example
 * ```tsx
 * const { isCapturing, startCapture, stopCapture, error } = useAudioCapture({
 *   sampleRate: 24000,
 *   onAudioData: (data) => sendToServer(data)
 * });
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioCaptureConfig, AudioCaptureReturn, AudioDataCallback } from '../types';

interface UseAudioCaptureProps extends AudioCaptureConfig {
  /** Callback for receiving processed audio data */
  onAudioData?: AudioDataCallback;
  /** Whether to automatically start capture */
  autoStart?: boolean;
}

/**
 * Hook for capturing and processing microphone audio
 */
export function useAudioCapture({
  sampleRate = 24000,
  workletPath = '/audio-processor.js',
  audioConstraints,
  onAudioData,
  autoStart = false,
}: UseAudioCaptureProps = {}): AudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /**
   * Start capturing audio from the microphone
   */
  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints || true,
      });
      streamRef.current = stream;

      // Create AudioContext with specified sample rate
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Load AudioWorklet processor
      await audioContext.audioWorklet.addModule(workletPath);

      // Create audio source and worklet node
      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'audio-capture-processor');

      sourceRef.current = source;
      audioWorkletNodeRef.current = workletNode;

      // Connect audio graph
      source.connect(workletNode);
      workletNode.connect(audioContext.destination);

      setIsCapturing(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start audio capture';
      setError(errorMessage);
      console.error('Audio capture error:', err);
      throw err;
    }
  }, [sampleRate, workletPath, audioConstraints]);

  /**
   * Stop capturing audio and release resources
   */
  const stopCapture = useCallback(() => {
    // Disconnect and cleanup audio nodes
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current.port.onmessage = null;
      audioWorkletNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsCapturing(false);
  }, []);

  /**
   * Pause audio capture (suspend context)
   */
  const pauseCapture = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, []);

  /**
   * Resume audio capture
   */
  const resumeCapture = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Update audio data handler when callback changes
  useEffect(() => {
    const workletNode = audioWorkletNodeRef.current;
    if (workletNode && onAudioData) {
      workletNode.port.onmessage = (event) => {
        onAudioData(event.data as ArrayBuffer);
      };
    }
  }, [onAudioData]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startCapture();
    }
  }, [autoStart, startCapture]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, [stopCapture]);

  return {
    stream: streamRef.current,
    audioContext: audioContextRef.current,
    isCapturing,
    error,
    startCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
  };
}
