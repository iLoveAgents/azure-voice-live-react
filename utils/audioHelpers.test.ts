import { describe, it, expect, vi } from 'vitest';
import { arrayBufferToBase64, createAudioDataCallback } from './audioHelpers';

describe('audioHelpers', () => {
  describe('arrayBufferToBase64', () => {
    it('should convert empty buffer to empty base64 string', () => {
      const buffer = new ArrayBuffer(0);
      const result = arrayBufferToBase64(buffer);

      expect(result).toBe('');
    });

    it('should convert small buffer to base64', () => {
      // Create a buffer with known data
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 72;  // 'H'
      view[1] = 101; // 'e'
      view[2] = 108; // 'l'
      view[3] = 108; // 'l'

      const result = arrayBufferToBase64(buffer);

      // "Hell" in base64
      expect(result).toBe('SGVsbA==');
    });

    it('should handle typical audio buffer size (24KB)', () => {
      // Typical audio chunk from microphone
      const buffer = new ArrayBuffer(24000);
      const view = new Uint8Array(buffer);

      // Fill with sample data
      for (let i = 0; i < view.length; i++) {
        view[i] = i % 256;
      }

      const result = arrayBufferToBase64(buffer);

      // Should be base64 string (length ~= original * 1.33)
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Verify it's valid base64
      expect(() => atob(result)).not.toThrow();
    });

    it('should handle large buffer without stack overflow (chunking test)', () => {
      // Create buffer larger than chunk size (32KB)
      const buffer = new ArrayBuffer(100000);
      const view = new Uint8Array(buffer);

      // Fill with pattern
      for (let i = 0; i < view.length; i++) {
        view[i] = (i * 7) % 256;
      }

      const result = arrayBufferToBase64(buffer);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Verify it's valid base64
      expect(() => atob(result)).not.toThrow();

      // Decode and verify data integrity
      const decoded = atob(result);
      expect(decoded.length).toBe(100000);
      expect(decoded.charCodeAt(0)).toBe(0);
      expect(decoded.charCodeAt(100)).toBe((100 * 7) % 256);
    });

    it('should produce consistent results', () => {
      const buffer = new ArrayBuffer(100);
      const view = new Uint8Array(buffer);
      view.fill(42);

      const result1 = arrayBufferToBase64(buffer);
      const result2 = arrayBufferToBase64(buffer);

      expect(result1).toBe(result2);
    });

    it('should handle buffer with all zeros', () => {
      const buffer = new ArrayBuffer(16);
      const result = arrayBufferToBase64(buffer);

      expect(result).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
    });

    it('should handle buffer with all 255s', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view.fill(255);

      const result = arrayBufferToBase64(buffer);

      expect(result).toBe('//////////8=');
    });
  });

  describe('createAudioDataCallback', () => {
    it('should create a callback function', () => {
      const sendEvent = vi.fn();
      const callback = createAudioDataCallback(sendEvent);

      expect(typeof callback).toBe('function');
    });

    it('should encode audio and send event when callback is invoked', () => {
      const sendEvent = vi.fn();
      const callback = createAudioDataCallback(sendEvent);

      // Create sample audio data
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 72;  // 'H'
      view[1] = 101; // 'e'
      view[2] = 108; // 'l'
      view[3] = 108; // 'l'
      view[4] = 111; // 'o'
      view[5] = 33;  // '!'
      view[6] = 33;  // '!'
      view[7] = 33;  // '!'

      callback(buffer);

      expect(sendEvent).toHaveBeenCalledOnce();
      expect(sendEvent).toHaveBeenCalledWith({
        type: 'input_audio_buffer.append',
        audio: 'SGVsbG8hISE=', // "Hello!!!" in base64
      });
    });

    it('should handle multiple callback invocations', () => {
      const sendEvent = vi.fn();
      const callback = createAudioDataCallback(sendEvent);

      const buffer1 = new ArrayBuffer(4);
      const buffer2 = new ArrayBuffer(4);

      callback(buffer1);
      callback(buffer2);

      expect(sendEvent).toHaveBeenCalledTimes(2);
      expect(sendEvent.mock.calls[0][0].type).toBe('input_audio_buffer.append');
      expect(sendEvent.mock.calls[1][0].type).toBe('input_audio_buffer.append');
    });

    it('should handle empty buffer', () => {
      const sendEvent = vi.fn();
      const callback = createAudioDataCallback(sendEvent);

      const buffer = new ArrayBuffer(0);
      callback(buffer);

      expect(sendEvent).toHaveBeenCalledWith({
        type: 'input_audio_buffer.append',
        audio: '',
      });
    });

    it('should handle large audio buffers', () => {
      const sendEvent = vi.fn();
      const callback = createAudioDataCallback(sendEvent);

      // Simulate typical microphone chunk (24KB @ 24kHz, 16-bit PCM)
      const buffer = new ArrayBuffer(48000);
      const view = new Uint8Array(buffer);

      // Fill with sample audio pattern
      for (let i = 0; i < view.length; i++) {
        view[i] = Math.sin(i * 0.1) * 128 + 128;
      }

      callback(buffer);

      expect(sendEvent).toHaveBeenCalledOnce();
      const event = sendEvent.mock.calls[0][0];
      expect(event.type).toBe('input_audio_buffer.append');
      expect(typeof event.audio).toBe('string');
      expect(event.audio.length).toBeGreaterThan(0);
    });

    it('should work with useAudioCapture pattern (integration example)', () => {
      // This test demonstrates the usage pattern from the docs
      const sendEvent = vi.fn();

      // Simulating useAudioCapture callback
      const onAudioData = createAudioDataCallback(sendEvent);

      // Simulate audio worklet producing data
      const audioData = new ArrayBuffer(960); // 20ms at 24kHz, 16-bit
      onAudioData(audioData);

      // Verify Voice Live API message format
      expect(sendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'input_audio_buffer.append',
          audio: expect.any(String),
        })
      );
    });
  });
});
