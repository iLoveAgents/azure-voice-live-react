import { describe, it, expect } from 'vitest';
import { withVoice, withSemanticVAD, compose } from './configHelpers';

describe('configHelpers', () => {
  describe('withVoice', () => {
    it('should add voice configuration', () => {
      const config = withVoice('en-US-Ava:DragonHDLatestNeural');

      expect(config.voice).toEqual({
        name: 'en-US-Ava:DragonHDLatestNeural',
        type: 'azure-standard',
      });
    });
  });

  describe('withSemanticVAD', () => {
    it('should add semantic VAD turn detection', () => {
      const config = withSemanticVAD();

      expect(config.turnDetection).toEqual({
        type: 'azure_semantic_vad',
        threshold: 0.5,
        removeFillerWords: false,
        interruptResponse: true,
        createResponse: true,
      });
    });

    it('should accept custom options', () => {
      const config = withSemanticVAD({
        threshold: 0.7,
        removeFillerWords: true,
        interruptResponse: false,
      });

      expect(config.turnDetection).toEqual({
        type: 'azure_semantic_vad',
        threshold: 0.7,
        removeFillerWords: true,
        interruptResponse: false,
        createResponse: true,
      });
    });
  });

  describe('compose', () => {
    it('should compose multiple configuration helpers', () => {
      const config = compose(
        withVoice('en-US-Ava:DragonHDLatestNeural'),
        withSemanticVAD({ threshold: 0.7 })
      )({});

      expect(config.voice).toBeDefined();
      expect(config.turnDetection).toBeDefined();
      expect(config.turnDetection?.threshold).toBe(0.7);
    });
  });
});
