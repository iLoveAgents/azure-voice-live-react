import { describe, it, expect } from 'vitest';
import {
  // Voice helpers
  withVoice,
  withHDVoice,
  withCustomVoice,
  // Avatar helpers
  withAvatar,
  withTransparentBackground,
  withBackgroundImage,
  withAvatarCrop,
  // Turn detection helpers
  withSemanticVAD,
  withMultilingualVAD,
  withEndOfUtterance,
  withoutTurnDetection,
  // Audio enhancement helpers
  withEchoCancellation,
  withoutEchoCancellation,
  withDeepNoiseReduction,
  withNearFieldNoiseReduction,
  withoutNoiseReduction,
  withSampleRate,
  // Output helpers
  withViseme,
  withWordTimestamps,
  // Transcription helpers
  withTranscription,
  withoutTranscription,
  // Function calling helpers
  withTools,
  withToolChoice,
  // Composition
  compose,
} from './configHelpers';

describe('configHelpers', () => {
  // ========================================================================
  // VOICE CONFIGURATION HELPERS
  // ========================================================================

  describe('withVoice', () => {
    it('should add voice configuration with string', () => {
      const config = withVoice('alloy');

      expect(config.voice).toBe('alloy');
    });

    it('should add HD voice configuration with object', () => {
      const config = withVoice({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
      });

      expect(config.voice).toEqual({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
      });
    });

    it('should merge with existing config', () => {
      const config = withVoice('echo', { temperature: 0.9 });

      expect(config.voice).toBe('echo');
      expect(config.temperature).toBe(0.9);
    });
  });

  describe('withHDVoice', () => {
    it('should configure HD voice with default options', () => {
      const config = withHDVoice('en-US-Ava:DragonHDLatestNeural');

      expect(config.voice).toEqual({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: undefined,
        rate: undefined,
      });
    });

    it('should configure HD voice with temperature and rate', () => {
      const config = withHDVoice('en-US-Ava:DragonHDLatestNeural', {
        temperature: 0.8,
        rate: '1.2',
      });

      expect(config.voice).toEqual({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
        temperature: 0.8,
        rate: '1.2',
      });
    });

    it('should merge with existing config', () => {
      const config = withHDVoice(
        'en-US-Ava:DragonHDLatestNeural',
        { temperature: 0.9 },
        { modalities: ['audio'] }
      );

      expect(config.voice?.name).toBe('en-US-Ava:DragonHDLatestNeural');
      expect(config.modalities).toEqual(['audio']);
    });
  });

  describe('withCustomVoice', () => {
    it('should configure custom voice', () => {
      const config = withCustomVoice('my-custom-voice-id');

      expect(config.voice).toEqual({
        name: 'my-custom-voice-id',
        type: 'azure-custom',
      });
    });

    it('should merge with existing config', () => {
      const config = withCustomVoice('my-voice', { temperature: 0.7 });

      expect(config.voice).toEqual({
        name: 'my-voice',
        type: 'azure-custom',
      });
      expect(config.temperature).toBe(0.7);
    });
  });

  // ========================================================================
  // AVATAR CONFIGURATION HELPERS
  // ========================================================================

  describe('withAvatar', () => {
    it('should configure avatar with defaults', () => {
      const config = withAvatar('lisa', 'casual-standing');

      expect(config.avatar).toEqual({
        character: 'lisa',
        style: 'casual-standing',
        customized: undefined,
        video: {
          codec: 'vp9',
          resolution: { width: 1920, height: 1080 },
          bitrate: 1000000,
        },
      });
    });

    it('should configure avatar with custom options', () => {
      const config = withAvatar('lisa', 'casual-standing', {
        resolution: { width: 1280, height: 720 },
        bitrate: 2000000,
        codec: 'h264',
        customized: true,
      });

      expect(config.avatar).toEqual({
        character: 'lisa',
        style: 'casual-standing',
        customized: true,
        video: {
          codec: 'h264',
          resolution: { width: 1280, height: 720 },
          bitrate: 2000000,
        },
      });
    });
  });

  describe('withTransparentBackground', () => {
    it('should set default green chroma key', () => {
      const config = withTransparentBackground({
        avatar: { character: 'lisa', style: 'casual-standing' },
      });

      expect(config.avatar?.video?.background?.color).toBe('#00FF00FF');
    });

    it('should allow custom chroma key color', () => {
      const config = withTransparentBackground(
        { avatar: { character: 'lisa', style: 'casual-standing' } },
        { keyColor: '#0000FFFF' }
      );

      expect(config.avatar?.video?.background?.color).toBe('#0000FFFF');
    });

    it('should preserve existing avatar config', () => {
      const config = withTransparentBackground({
        avatar: {
          character: 'lisa',
          style: 'casual-sitting',
          video: { codec: 'h264' },
        },
      });

      expect(config.avatar?.character).toBe('lisa');
      expect(config.avatar?.style).toBe('casual-sitting');
      expect(config.avatar?.video?.codec).toBe('h264');
    });
  });

  describe('withBackgroundImage', () => {
    it('should set background image URL', () => {
      const config = withBackgroundImage('https://example.com/bg.jpg', {
        avatar: { character: 'lisa', style: 'casual-standing' },
      });

      expect(config.avatar?.video?.background?.imageUrl).toBe(
        'https://example.com/bg.jpg'
      );
    });

    it('should work with empty config', () => {
      const config = withBackgroundImage('https://example.com/bg.jpg');

      expect(config.avatar?.video?.background?.imageUrl).toBe(
        'https://example.com/bg.jpg'
      );
      expect(config.avatar?.character).toBe('');
      expect(config.avatar?.style).toBe('');
    });
  });

  describe('withAvatarCrop', () => {
    it('should set crop coordinates', () => {
      const config = withAvatarCrop(
        {
          topLeft: [0.1, 0.1],
          bottomRight: [0.9, 0.9],
        },
        { avatar: { character: 'lisa', style: 'casual-standing' } }
      );

      expect(config.avatar?.video?.crop).toEqual({
        topLeft: [0.1, 0.1],
        bottomRight: [0.9, 0.9],
      });
    });

    it('should preserve existing avatar config', () => {
      const config = withAvatarCrop(
        {
          topLeft: [0, 0.2],
          bottomRight: [1, 0.8],
        },
        {
          avatar: {
            character: 'lisa',
            style: 'casual-sitting',
            video: { codec: 'h264', bitrate: 2000000 },
          },
        }
      );

      expect(config.avatar?.character).toBe('lisa');
      expect(config.avatar?.video?.codec).toBe('h264');
      expect(config.avatar?.video?.bitrate).toBe(2000000);
    });
  });

  // ========================================================================
  // TURN DETECTION HELPERS
  // ========================================================================

  describe('withSemanticVAD', () => {
    it('should add semantic VAD with defaults', () => {
      const config = withSemanticVAD();

      expect(config.turnDetection).toEqual({
        type: 'azure_semantic_vad',
        threshold: 0.5,
        prefixPaddingMs: 300,
        speechDurationMs: 80,
        silenceDurationMs: 500,
        removeFillerWords: false,
        interruptResponse: true,
        createResponse: true,
        autoTruncate: undefined,
      });
    });

    it('should accept custom options', () => {
      const config = withSemanticVAD({
        threshold: 0.7,
        removeFillerWords: true,
        silenceDurationMs: 600,
        autoTruncate: true,
      });

      expect(config.turnDetection).toMatchObject({
        type: 'azure_semantic_vad',
        threshold: 0.7,
        removeFillerWords: true,
        silenceDurationMs: 600,
        autoTruncate: true,
      });
    });

    it('should merge with existing config', () => {
      const config = withSemanticVAD({ threshold: 0.6 }, { voice: 'alloy' });

      expect(config.turnDetection?.threshold).toBe(0.6);
      expect(config.voice).toBe('alloy');
    });
  });

  describe('withMultilingualVAD', () => {
    it('should configure multilingual VAD', () => {
      const config = withMultilingualVAD(['en', 'es', 'fr']);

      expect(config.turnDetection).toMatchObject({
        type: 'azure_semantic_vad_multilingual',
        languages: ['en', 'es', 'fr'],
        threshold: 0.5,
        removeFillerWords: true,
      });
    });

    it('should accept custom options', () => {
      const config = withMultilingualVAD(
        ['en', 'de'],
        {
          threshold: 0.7,
          removeFillerWords: false,
          silenceDurationMs: 400,
        }
      );

      expect(config.turnDetection).toMatchObject({
        type: 'azure_semantic_vad_multilingual',
        languages: ['en', 'de'],
        threshold: 0.7,
        removeFillerWords: false,
        silenceDurationMs: 400,
      });
    });
  });

  describe('withEndOfUtterance', () => {
    it('should add end-of-utterance detection with defaults', () => {
      const config = withEndOfUtterance();

      expect(config.turnDetection?.endOfUtteranceDetection).toEqual({
        model: 'semantic_detection_v1',
        thresholdLevel: 'default',
        timeoutMs: 1000,
      });
    });

    it('should use multilingual model when appropriate', () => {
      const config = withEndOfUtterance(
        {},
        {
          turnDetection: {
            type: 'azure_semantic_vad_multilingual',
            languages: ['en', 'es'],
          },
        }
      );

      expect(config.turnDetection?.endOfUtteranceDetection?.model).toBe(
        'semantic_detection_v1_multilingual'
      );
    });

    it('should accept custom options', () => {
      const config = withEndOfUtterance({
        thresholdLevel: 'high',
        timeoutMs: 2000,
      });

      expect(config.turnDetection?.endOfUtteranceDetection).toMatchObject({
        thresholdLevel: 'high',
        timeoutMs: 2000,
      });
    });
  });

  describe('withoutTurnDetection', () => {
    it('should disable turn detection', () => {
      const config = withoutTurnDetection();

      expect(config.turnDetection).toBeNull();
    });

    it('should override existing turn detection', () => {
      const config = withoutTurnDetection({
        turnDetection: { type: 'server_vad' },
      });

      expect(config.turnDetection).toBeNull();
    });
  });

  // ========================================================================
  // AUDIO ENHANCEMENT HELPERS
  // ========================================================================

  describe('withEchoCancellation', () => {
    it('should enable echo cancellation', () => {
      const config = withEchoCancellation();

      expect(config.inputAudioEchoCancellation).toEqual({
        type: 'server_echo_cancellation',
      });
    });
  });

  describe('withoutEchoCancellation', () => {
    it('should disable echo cancellation', () => {
      const config = withoutEchoCancellation();

      expect(config.inputAudioEchoCancellation).toBeNull();
    });
  });

  describe('withDeepNoiseReduction', () => {
    it('should enable Azure deep noise suppression', () => {
      const config = withDeepNoiseReduction();

      expect(config.inputAudioNoiseReduction).toEqual({
        type: 'azure_deep_noise_suppression',
      });
    });
  });

  describe('withNearFieldNoiseReduction', () => {
    it('should enable near-field noise reduction', () => {
      const config = withNearFieldNoiseReduction();

      expect(config.inputAudioNoiseReduction).toEqual({
        type: 'near_field',
      });
    });
  });

  describe('withoutNoiseReduction', () => {
    it('should disable noise reduction', () => {
      const config = withoutNoiseReduction();

      expect(config.inputAudioNoiseReduction).toBeNull();
    });
  });

  describe('withSampleRate', () => {
    it('should set sample rate to 24000', () => {
      const config = withSampleRate(24000);

      expect(config.inputAudioSamplingRate).toBe(24000);
    });

    it('should set sample rate to 16000', () => {
      const config = withSampleRate(16000);

      expect(config.inputAudioSamplingRate).toBe(16000);
    });
  });

  // ========================================================================
  // OUTPUT CONFIGURATION HELPERS
  // ========================================================================

  describe('withViseme', () => {
    it('should enable viseme output', () => {
      const config = withViseme();

      expect(config.animation).toEqual({
        outputs: ['viseme_id'],
      });
    });

    it('should merge with existing config', () => {
      const config = withViseme({ voice: 'en-US-AvaNeural' });

      expect(config.animation?.outputs).toEqual(['viseme_id']);
      expect(config.voice).toBe('en-US-AvaNeural');
    });
  });

  describe('withWordTimestamps', () => {
    it('should enable word timestamps', () => {
      const config = withWordTimestamps();

      expect(config.outputAudioTimestampTypes).toEqual(['word']);
    });
  });

  // ========================================================================
  // INPUT TRANSCRIPTION HELPERS
  // ========================================================================

  describe('withTranscription', () => {
    it('should enable transcription with defaults', () => {
      const config = withTranscription();

      expect(config.inputAudioTranscription).toEqual({
        model: 'whisper-1',
        language: undefined,
        prompt: undefined,
      });
    });

    it('should accept custom options', () => {
      const config = withTranscription({
        model: 'azure-speech',
        language: 'en',
        prompt: 'Custom prompt',
      });

      expect(config.inputAudioTranscription).toEqual({
        model: 'azure-speech',
        language: 'en',
        prompt: 'Custom prompt',
      });
    });
  });

  describe('withoutTranscription', () => {
    it('should disable transcription', () => {
      const config = withoutTranscription();

      expect(config.inputAudioTranscription).toBeNull();
    });
  });

  // ========================================================================
  // FUNCTION CALLING HELPERS
  // ========================================================================

  describe('withTools', () => {
    it('should add tools with auto choice', () => {
      const tools = [
        {
          type: 'function',
          name: 'get_weather',
          description: 'Get weather',
          parameters: { type: 'object', properties: {} },
        },
      ];

      const config = withTools(tools);

      expect(config.tools).toEqual(tools);
      expect(config.toolChoice).toBe('auto');
    });

    it('should merge with existing config', () => {
      const config = withTools([{ type: 'function', name: 'test' }], {
        voice: 'alloy',
      });

      expect(config.tools).toHaveLength(1);
      expect(config.voice).toBe('alloy');
    });
  });

  describe('withToolChoice', () => {
    it('should set tool choice to auto', () => {
      const config = withToolChoice('auto');

      expect(config.toolChoice).toBe('auto');
    });

    it('should set tool choice to required', () => {
      const config = withToolChoice('required');

      expect(config.toolChoice).toBe('required');
    });

    it('should set tool choice to none', () => {
      const config = withToolChoice('none');

      expect(config.toolChoice).toBe('none');
    });
  });

  // ========================================================================
  // COMPOSITION HELPERS
  // ========================================================================

  describe('compose', () => {
    it('should compose multiple configuration helpers', () => {
      const config = compose(
        (c) => withVoice('alloy', c),
        (c) => withSemanticVAD({ threshold: 0.7 }, c),
        (c) => withEchoCancellation(c)
      )({});

      expect(config.voice).toBe('alloy');
      expect(config.turnDetection?.threshold).toBe(0.7);
      expect(config.inputAudioEchoCancellation).toEqual({
        type: 'server_echo_cancellation',
      });
    });

    it('should apply functions in order', () => {
      const config = compose(
        (c) => withVoice('alloy', c),
        (c) => withVoice('echo', c) // Should override
      )({});

      expect(config.voice).toBe('echo');
    });

    it('should work with complex compositions', () => {
      const enhance = compose(
        (c) => withEchoCancellation(c),
        (c) => withDeepNoiseReduction(c),
        (c) => withSampleRate(24000, c)
      );

      const config = enhance({});

      expect(config.inputAudioEchoCancellation?.type).toBe(
        'server_echo_cancellation'
      );
      expect(config.inputAudioNoiseReduction?.type).toBe(
        'azure_deep_noise_suppression'
      );
      expect(config.inputAudioSamplingRate).toBe(24000);
    });
  });

  // ========================================================================
  // REAL-WORLD USAGE EXAMPLES
  // ========================================================================

  describe('Real-world usage patterns', () => {
    it('should build voice-only config', () => {
      const config = compose(
        (c) => withVoice('alloy', c),
        (c) => withSemanticVAD({}, c),
        (c) => withEchoCancellation(c),
        (c) => withDeepNoiseReduction(c)
      )({});

      expect(config.voice).toBe('alloy');
      expect(config.turnDetection?.type).toBe('azure_semantic_vad');
      expect(config.inputAudioEchoCancellation).toBeDefined();
      expect(config.inputAudioNoiseReduction).toBeDefined();
    });

    it('should build avatar config with transparent background', () => {
      const config = compose(
        (c) => withAvatar('lisa', 'casual-sitting', {}, c),
        (c) => withTransparentBackground(c)
      )({});

      expect(config.avatar?.character).toBe('lisa');
      expect(config.avatar?.video?.background?.color).toBe('#00FF00FF');
    });

    it('should build HD voice config with custom settings', () => {
      const config = withHDVoice('en-US-Ava:DragonHDLatestNeural', {
        temperature: 0.9,
        rate: '1.1',
      });

      expect(config.voice?.name).toBe('en-US-Ava:DragonHDLatestNeural');
      expect(config.voice?.temperature).toBe(0.9);
      expect(config.voice?.rate).toBe('1.1');
    });

    it('should build multilingual config', () => {
      const config = compose(
        (c) => withMultilingualVAD(['en', 'es', 'fr', 'de'], {}, c),
        (c) => withTranscription({ language: 'auto' }, c)
      )({});

      expect(config.turnDetection?.languages).toEqual(['en', 'es', 'fr', 'de']);
      expect(config.inputAudioTranscription?.language).toBe('auto');
    });

    it('should build function calling config', () => {
      const config = compose(
        (c) =>
          withTools(
            [
              {
                type: 'function',
                name: 'get_current_time',
                description: 'Get time',
                parameters: { type: 'object', properties: {} },
              },
            ],
            c
          ),
        (c) => withToolChoice('required', c)
      )({});

      expect(config.tools).toHaveLength(1);
      expect(config.toolChoice).toBe('required');
    });

    it('should disable features explicitly', () => {
      const config = compose(
        (c) => withoutTurnDetection(c),
        (c) => withoutEchoCancellation(c),
        (c) => withoutNoiseReduction(c),
        (c) => withoutTranscription(c)
      )({});

      expect(config.turnDetection).toBeNull();
      expect(config.inputAudioEchoCancellation).toBeNull();
      expect(config.inputAudioNoiseReduction).toBeNull();
      expect(config.inputAudioTranscription).toBeNull();
    });
  });
});
