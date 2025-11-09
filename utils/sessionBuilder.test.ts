import { describe, it, expect } from 'vitest';
import {
  buildSessionConfig,
  buildAgentSessionConfig,
  validateConfig,
  DEFAULT_SESSION_CONFIG,
} from './sessionBuilder';
import type { VoiceLiveSessionConfig } from '../types/voiceLive';

describe('sessionBuilder', () => {
  describe('DEFAULT_SESSION_CONFIG', () => {
    it('should have sensible defaults optimized for production', () => {
      expect(DEFAULT_SESSION_CONFIG).toMatchObject({
        modalities: ['text', 'audio'],
        temperature: 0.8,
        maxResponseOutputTokens: 'inf',
        inputAudioFormat: 'pcm16',
        outputAudioFormat: 'pcm16',
        voice: 'alloy',
        inputAudioSamplingRate: 24000,
      });
    });

    it('should enable audio enhancements by default', () => {
      expect(DEFAULT_SESSION_CONFIG.inputAudioEchoCancellation).toEqual({
        type: 'server_echo_cancellation',
      });

      expect(DEFAULT_SESSION_CONFIG.inputAudioNoiseReduction).toEqual({
        type: 'azure_deep_noise_suppression',
      });
    });

    it('should use Azure semantic VAD with sensible defaults', () => {
      expect(DEFAULT_SESSION_CONFIG.turnDetection).toEqual({
        type: 'azure_semantic_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        speechDurationMs: 80,
        silenceDurationMs: 500,
        removeFillerWords: false,
        interruptResponse: true,
        createResponse: true,
      });
    });
  });

  describe('buildSessionConfig', () => {
    it('should return default config when no user config provided', () => {
      const config = buildSessionConfig();

      expect(config.modalities).toEqual(['text', 'audio']);
      expect(config.input_audio_format).toBe('pcm16');
      expect(config.output_audio_format).toBe('pcm16');
      expect(config.voice).toEqual({ name: 'alloy' });
    });

    it('should convert camelCase to snake_case for API wire format', () => {
      const config = buildSessionConfig();

      // Check snake_case conversion
      expect(config.input_audio_format).toBeDefined();
      expect(config.output_audio_format).toBeDefined();
      expect(config.input_audio_sampling_rate).toBe(24000);
      expect(config.max_response_output_tokens).toBe('inf');
      expect(config.turn_detection).toBeDefined();
      expect(config.input_audio_echo_cancellation).toBeDefined();
      expect(config.input_audio_noise_reduction).toBeDefined();

      // Ensure camelCase doesn't exist
      expect(config.inputAudioFormat).toBeUndefined();
      expect(config.outputAudioFormat).toBeUndefined();
      expect(config.maxResponseOutputTokens).toBeUndefined();
    });

    it('should merge user config with defaults', () => {
      const userConfig: VoiceLiveSessionConfig = {
        temperature: 0.9,
        voice: 'shimmer',
      };

      const config = buildSessionConfig(userConfig);

      // User values should override
      expect(config.temperature).toBe(0.9);
      expect(config.voice).toEqual({ name: 'shimmer' });

      // Defaults should be preserved
      expect(config.modalities).toEqual(['text', 'audio']);
      expect(config.input_audio_format).toBe('pcm16');
    });

    it('should handle null values to disable features', () => {
      const userConfig: VoiceLiveSessionConfig = {
        inputAudioEchoCancellation: null,
        inputAudioNoiseReduction: null,
        turnDetection: null,
      };

      const config = buildSessionConfig(userConfig);

      expect(config.input_audio_echo_cancellation).toBeNull();
      expect(config.input_audio_noise_reduction).toBeNull();
      expect(config.turn_detection).toBeNull();
    });

    it('should deep merge nested objects', () => {
      const userConfig: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'azure_semantic_vad',
          threshold: 0.7,
          removeFillerWords: true,
          // Other fields should come from defaults
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.turn_detection.type).toBe('azure_semantic_vad');
      expect(config.turn_detection.threshold).toBe(0.7);
      expect(config.turn_detection.remove_filler_words).toBe(true);

      // Defaults should still be present
      expect(config.turn_detection.prefix_padding_ms).toBe(300);
      expect(config.turn_detection.speech_duration_ms).toBe(80);
      expect(config.turn_detection.interrupt_response).toBe(true);
    });

    it('should handle voice as string', () => {
      const userConfig: VoiceLiveSessionConfig = {
        voice: 'echo',
      };

      const config = buildSessionConfig(userConfig);

      expect(config.voice).toEqual({ name: 'echo' });
    });

    it('should handle voice as object with full config', () => {
      const userConfig: VoiceLiveSessionConfig = {
        voice: {
          name: 'en-US-Ava:DragonHDLatestNeural',
          type: 'azure-standard',
          temperature: 0.9,
          rate: 1.2,
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.voice).toEqual({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: 0.9,
        rate: '1.2', // Should be converted to string
      });
    });

    it('should handle avatar configuration', () => {
      const userConfig: VoiceLiveSessionConfig = {
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
          video: {
            codec: 'h264',
            resolution: '720x1280',
            background: {
              color: '#00FF00',
            },
          },
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.avatar.character).toBe('lisa');
      expect(config.avatar.style).toBe('casual-sitting');
      expect(config.avatar.video.codec).toBe('h264');
      expect(config.avatar.video.resolution).toBe('720x1280');
      expect(config.avatar.video.background.color).toBe('#00FF00');
    });

    it('should handle avatar video crop configuration', () => {
      const userConfig: VoiceLiveSessionConfig = {
        avatar: {
          character: 'lisa',
          video: {
            crop: {
              topLeft: [0, 100],
              bottomRight: [720, 1180],
            },
          },
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.avatar.video.crop.top_left).toEqual([0, 100]);
      expect(config.avatar.video.crop.bottom_right).toEqual([720, 1180]);
    });

    it('should handle animation (viseme) configuration', () => {
      const userConfig: VoiceLiveSessionConfig = {
        animation: {
          outputs: ['viseme'],
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.animation.outputs).toEqual(['viseme']);
    });

    it('should handle input audio transcription', () => {
      const userConfig: VoiceLiveSessionConfig = {
        inputAudioTranscription: {
          model: 'whisper-1',
          language: 'en',
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.input_audio_transcription.model).toBe('whisper-1');
      expect(config.input_audio_transcription.language).toBe('en');
    });

    it('should handle tools and tool choice', () => {
      const userConfig: VoiceLiveSessionConfig = {
        tools: [
          {
            type: 'function',
            name: 'get_weather',
            description: 'Get weather info',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
            },
          },
        ],
        toolChoice: 'required',
      };

      const config = buildSessionConfig(userConfig);

      expect(config.tools).toHaveLength(1);
      expect(config.tools[0].name).toBe('get_weather');
      expect(config.tool_choice).toBe('required');
    });

    it('should handle different turn detection types', () => {
      const configs = [
        { type: 'server_vad' as const },
        { type: 'semantic_vad' as const, eagerness: 'high' as const },
        { type: 'azure_semantic_vad' as const, removeFillerWords: true },
      ];

      configs.forEach((turnDetection) => {
        const config = buildSessionConfig({ turnDetection });
        expect(config.turn_detection.type).toBe(turnDetection.type);
      });
    });

    it('should handle end-of-utterance detection', () => {
      const userConfig: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'azure_semantic_vad',
          endOfUtteranceDetection: {
            model: 'eou-1',
            thresholdLevel: 'medium',
            timeoutMs: 1000,
          },
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.turn_detection.end_of_utterance_detection).toEqual({
        model: 'eou-1',
        threshold_level: 'medium',
        timeout_ms: 1000,
      });
    });

    it('should handle multilingual VAD', () => {
      const userConfig: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'azure_semantic_vad',
          languages: ['en', 'es', 'fr'],
        },
      };

      const config = buildSessionConfig(userConfig);

      expect(config.turn_detection.languages).toEqual(['en', 'es', 'fr']);
    });
  });

  describe('buildAgentSessionConfig', () => {
    it('should return minimal config for agent mode', () => {
      const config = buildAgentSessionConfig();

      // Should have basic audio config
      expect(config.modalities).toEqual(['text', 'audio']);
      expect(config.input_audio_format).toBe('pcm16');
      expect(config.output_audio_format).toBe('pcm16');
      expect(config.input_audio_sampling_rate).toBe(24000);

      // Should NOT have instructions, temperature, tools, etc.
      expect(config.instructions).toBeUndefined();
      expect(config.temperature).toBeUndefined();
      expect(config.tools).toBeUndefined();
      expect(config.max_response_output_tokens).toBeUndefined();
    });

    it('should include audio enhancements', () => {
      const config = buildAgentSessionConfig();

      expect(config.input_audio_echo_cancellation).toEqual({
        type: 'server_echo_cancellation',
      });

      expect(config.input_audio_noise_reduction).toEqual({
        type: 'azure_deep_noise_suppression',
      });
    });

    it('should include turn detection', () => {
      const config = buildAgentSessionConfig();

      expect(config.turn_detection.type).toBe('azure_semantic_vad');
      expect(config.turn_detection.threshold).toBe(0.5);
    });

    it('should allow voice configuration override', () => {
      const userConfig: VoiceLiveSessionConfig = {
        voice: 'en-US-Ava:DragonHDLatestNeural',
      };

      const config = buildAgentSessionConfig(userConfig);

      expect(config.voice).toEqual({ name: 'en-US-Ava:DragonHDLatestNeural' });
    });

    it('should allow avatar configuration', () => {
      const userConfig: VoiceLiveSessionConfig = {
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
        },
      };

      const config = buildAgentSessionConfig(userConfig);

      expect(config.avatar.character).toBe('lisa');
      expect(config.avatar.style).toBe('casual-sitting');
    });

    it('should allow audio settings override', () => {
      const userConfig: VoiceLiveSessionConfig = {
        inputAudioSamplingRate: 16000,
        inputAudioEchoCancellation: null,
      };

      const config = buildAgentSessionConfig(userConfig);

      expect(config.input_audio_sampling_rate).toBe(16000);
      expect(config.input_audio_echo_cancellation).toBeNull();
    });

    it('should allow turn detection override', () => {
      const userConfig: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'server_vad',
          threshold: 0.3,
        },
      };

      const config = buildAgentSessionConfig(userConfig);

      expect(config.turn_detection.type).toBe('server_vad');
      expect(config.turn_detection.threshold).toBe(0.3);
    });

    it('should not include model or instruction-related fields', () => {
      const config = buildAgentSessionConfig();

      // These should not be present in agent mode
      expect(config.instructions).toBeUndefined();
      expect(config.temperature).toBeUndefined();
      expect(config.max_response_output_tokens).toBeUndefined();
      expect(config.tools).toBeUndefined();
      expect(config.tool_choice).toBeUndefined();
    });
  });

  describe('validateConfig', () => {
    it('should allow valid config in normal mode', () => {
      const config: VoiceLiveSessionConfig = {
        instructions: 'You are a helpful assistant',
        voice: 'alloy',
      };

      expect(() => validateConfig(config, false)).not.toThrow();
    });

    it('should throw error if instructions provided in agent mode', () => {
      const config: VoiceLiveSessionConfig = {
        instructions: 'You are a helpful assistant',
        voice: 'alloy',
      };

      expect(() => validateConfig(config, true)).toThrow(
        'Instructions cannot be set in Agent Service mode'
      );
    });

    it('should allow config without instructions in agent mode', () => {
      const config: VoiceLiveSessionConfig = {
        voice: 'alloy',
      };

      expect(() => validateConfig(config, true)).not.toThrow();
    });

    it('should allow semantic VAD with eagerness', () => {
      const config: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'semantic_vad',
          eagerness: 'high',
        },
      };

      expect(() => validateConfig(config, false)).not.toThrow();
    });

    it('should allow end-of-utterance detection config', () => {
      const config: VoiceLiveSessionConfig = {
        turnDetection: {
          type: 'azure_semantic_vad',
          endOfUtteranceDetection: {
            model: 'eou-1',
            thresholdLevel: 'medium',
            timeoutMs: 1000,
          },
        },
      };

      expect(() => validateConfig(config, false)).not.toThrow();
    });
  });

  describe('Deep merge behavior', () => {
    it('should preserve null values (disable features)', () => {
      const config = buildSessionConfig({
        turnDetection: null,
      });

      expect(config.turn_detection).toBeNull();
    });

    it('should skip undefined values (use defaults)', () => {
      const config = buildSessionConfig({
        temperature: undefined,
        voice: 'echo',
      });

      // temperature should come from default (0.8)
      expect(config.temperature).toBe(0.8);
      // voice should be overridden
      expect(config.voice.name).toBe('echo');
    });

    it('should replace arrays, not merge them', () => {
      const config = buildSessionConfig({
        modalities: ['audio'],
      });

      expect(config.modalities).toEqual(['audio']);
    });

    it('should recursively merge nested objects', () => {
      const config = buildSessionConfig({
        turnDetection: {
          threshold: 0.7, // Override
          // silenceDurationMs should come from defaults
        },
      });

      expect(config.turn_detection.threshold).toBe(0.7);
      expect(config.turn_detection.silence_duration_ms).toBe(500);
    });

    it('should handle complex nested structures', () => {
      const config = buildSessionConfig({
        avatar: {
          character: 'lisa',
          video: {
            codec: 'h264',
            background: {
              color: '#00FF00',
            },
          },
        },
      });

      expect(config.avatar.character).toBe('lisa');
      expect(config.avatar.video.codec).toBe('h264');
      expect(config.avatar.video.background.color).toBe('#00FF00');
    });
  });

  describe('Real-world usage examples', () => {
    it('should build basic voice-only config', () => {
      const config = buildSessionConfig({
        instructions: 'You are a friendly assistant',
        voice: 'alloy',
      });

      expect(config.instructions).toBe('You are a friendly assistant');
      expect(config.voice.name).toBe('alloy');
      expect(config.modalities).toEqual(['text', 'audio']);
    });

    it('should build avatar config with custom settings', () => {
      const config = buildSessionConfig({
        voice: 'en-US-Ava:DragonHDLatestNeural',
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
          video: {
            codec: 'h264',
            resolution: '720x1280',
            background: {
              color: '#00FF00', // Green screen
            },
          },
        },
      });

      expect(config.voice.name).toBe('en-US-Ava:DragonHDLatestNeural');
      expect(config.avatar.character).toBe('lisa');
      expect(config.avatar.video.background.color).toBe('#00FF00');
    });

    it('should build function calling config', () => {
      const config = buildSessionConfig({
        tools: [
          {
            type: 'function',
            name: 'get_current_time',
            description: 'Get the current time',
            parameters: {
              type: 'object',
              properties: {},
            },
          },
        ],
        toolChoice: 'auto',
      });

      expect(config.tools).toHaveLength(1);
      expect(config.tools[0].name).toBe('get_current_time');
      expect(config.tool_choice).toBe('auto');
    });

    it('should build low-latency config', () => {
      const config = buildSessionConfig({
        turnDetection: {
          type: 'server_vad',
          threshold: 0.3,
          silenceDurationMs: 300,
        },
      });

      expect(config.turn_detection.type).toBe('server_vad');
      expect(config.turn_detection.threshold).toBe(0.3);
      expect(config.turn_detection.silence_duration_ms).toBe(300);
    });

    it('should build agent config for Azure AI Foundry', () => {
      const config = buildAgentSessionConfig({
        voice: 'en-US-Ava:DragonHDLatestNeural',
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
        },
      });

      // Should have voice and avatar
      expect(config.voice.name).toBe('en-US-Ava:DragonHDLatestNeural');
      expect(config.avatar.character).toBe('lisa');

      // Should NOT have instructions or tools
      expect(config.instructions).toBeUndefined();
      expect(config.tools).toBeUndefined();
    });
  });
});
