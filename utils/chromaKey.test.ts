import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChromaKeyProcessor, DEFAULT_GREEN_SCREEN } from './chromaKey';

describe('chromaKey', () => {
  describe('DEFAULT_GREEN_SCREEN', () => {
    it('should provide default green screen configuration', () => {
      expect(DEFAULT_GREEN_SCREEN).toEqual({
        keyColor: [0.0, 1.0, 0.0], // Pure green in RGB
        similarity: 0.4,
        smoothness: 0.1,
      });
    });

    it('should use normalized RGB values (0.0 to 1.0)', () => {
      const { keyColor } = DEFAULT_GREEN_SCREEN;

      // All values should be between 0 and 1
      expect(keyColor.every((v) => v >= 0 && v <= 1)).toBe(true);

      // Should be pure green [R=0, G=1, B=0]
      expect(keyColor[0]).toBe(0.0); // Red
      expect(keyColor[1]).toBe(1.0); // Green
      expect(keyColor[2]).toBe(0.0); // Blue
    });

    it('should have reasonable similarity and smoothness values', () => {
      expect(DEFAULT_GREEN_SCREEN.similarity).toBeGreaterThan(0);
      expect(DEFAULT_GREEN_SCREEN.similarity).toBeLessThan(1);

      expect(DEFAULT_GREEN_SCREEN.smoothness).toBeGreaterThan(0);
      expect(DEFAULT_GREEN_SCREEN.smoothness).toBeLessThan(1);
    });
  });

  describe('createChromaKeyProcessor', () => {
    let mockVideo: HTMLVideoElement;
    let mockCanvas: HTMLCanvasElement;
    let mockGl: any;

    beforeEach(() => {
      // Create minimal mocks for video and canvas
      mockVideo = {
        videoWidth: 1920,
        videoHeight: 1080,
        paused: false,
        ended: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      // Mock WebGL context
      mockGl = {
        VERTEX_SHADER: 35633,
        FRAGMENT_SHADER: 35632,
        COMPILE_STATUS: 35713,
        LINK_STATUS: 35714,
        ARRAY_BUFFER: 34962,
        STATIC_DRAW: 35044,
        FLOAT: 5126,
        TRIANGLES: 4,
        TEXTURE_2D: 3553,
        TEXTURE_WRAP_S: 10242,
        TEXTURE_WRAP_T: 10243,
        TEXTURE_MIN_FILTER: 10241,
        TEXTURE_MAG_FILTER: 10240,
        CLAMP_TO_EDGE: 33071,
        LINEAR: 9729,
        RGBA: 6408,
        UNSIGNED_BYTE: 5121,
        BLEND: 3042,
        SRC_ALPHA: 770,
        ONE_MINUS_SRC_ALPHA: 771,
        viewport: vi.fn(),
        createShader: vi.fn((type) => ({ type })),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(() => true),
        getShaderInfoLog: vi.fn(),
        deleteShader: vi.fn(),
        createProgram: vi.fn(() => ({ id: 'program' })),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => true),
        getProgramInfoLog: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(() => ({ id: 'buffer' })),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        getAttribLocation: vi.fn(() => 0),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        createTexture: vi.fn(() => ({ id: 'texture' })),
        bindTexture: vi.fn(),
        texParameteri: vi.fn(),
        getUniformLocation: vi.fn(() => ({ id: 'uniform' })),
        uniform3f: vi.fn(),
        uniform1f: vi.fn(),
        enable: vi.fn(),
        blendFunc: vi.fn(),
        texImage2D: vi.fn(),
        drawArrays: vi.fn(),
      };

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn((type) => {
          if (type === 'webgl2' || type === 'webgl') {
            return mockGl;
          }
          return null;
        }),
      } as any;
    });

    it('should create processor with default green screen config', () => {
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(processor).not.toBeNull();
      expect(processor).toHaveProperty('start');
      expect(processor).toHaveProperty('stop');
      expect(processor).toHaveProperty('updateConfig');
    });

    it('should create processor with custom config', () => {
      const customConfig = {
        keyColor: [0.0, 0.0, 1.0] as [number, number, number], // Blue instead of green
        similarity: 0.5,
        smoothness: 0.2,
      };

      const processor = createChromaKeyProcessor(
        mockVideo,
        mockCanvas,
        customConfig
      );

      expect(processor).not.toBeNull();

      // Verify custom config was applied
      expect(mockGl.uniform3f).toHaveBeenCalledWith(
        expect.anything(),
        0.0,
        0.0,
        1.0
      );
      expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 0.5);
      expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 0.2);
    });

    it('should set canvas dimensions to match video', () => {
      createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1080);
      expect(mockGl.viewport).toHaveBeenCalledWith(0, 0, 1920, 1080);
    });

    it('should return null when WebGL is not supported', () => {
      const canvasWithoutWebGL = {
        getContext: vi.fn(() => null),
      } as any;

      const processor = createChromaKeyProcessor(mockVideo, canvasWithoutWebGL);

      expect(processor).toBeNull();
    });

    it('should provide start() method to begin processing', () => {
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(processor).not.toBeNull();
      expect(typeof processor!.start).toBe('function');

      // Should not throw
      processor!.start();
    });

    it('should provide stop() method to halt processing', () => {
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(processor).not.toBeNull();
      expect(typeof processor!.stop).toBe('function');

      // Should not throw
      processor!.stop();

      // Should remove event listener
      expect(mockVideo.removeEventListener).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      );
    });

    it('should provide updateConfig() method to change chroma key settings', () => {
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(processor).not.toBeNull();
      expect(typeof processor!.updateConfig).toBe('function');

      // Clear previous calls
      mockGl.uniform3f.mockClear();
      mockGl.uniform1f.mockClear();

      // Update config
      processor!.updateConfig({
        keyColor: [1.0, 0.0, 0.0], // Change to red
        similarity: 0.6,
        smoothness: 0.15,
      });

      // Verify uniforms were updated
      expect(mockGl.uniform3f).toHaveBeenCalledWith(
        expect.anything(),
        1.0,
        0.0,
        0.0
      );
      expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 0.6);
      expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 0.15);
    });

    it('should partially update config (only changed values)', () => {
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      mockGl.uniform3f.mockClear();
      mockGl.uniform1f.mockClear();

      // Update only similarity
      processor!.updateConfig({
        similarity: 0.7,
      });

      // Should only update similarity uniform
      expect(mockGl.uniform3f).not.toHaveBeenCalled();
      expect(mockGl.uniform1f).toHaveBeenCalledWith(expect.anything(), 0.7);
    });

    it('should register play event listener on video', () => {
      createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(mockVideo.addEventListener).toHaveBeenCalledWith(
        'play',
        expect.any(Function)
      );
    });
  });

  describe('Usage examples', () => {
    it('should demonstrate basic chroma key usage', () => {
      // This test demonstrates the typical usage pattern
      // In a real app, you would have actual HTMLVideoElement and HTMLCanvasElement

      const mockVideo = {
        videoWidth: 1920,
        videoHeight: 1080,
        paused: false,
        ended: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          // Minimal WebGL mock
          VERTEX_SHADER: 35633,
          FRAGMENT_SHADER: 35632,
          COMPILE_STATUS: 35713,
          LINK_STATUS: 35714,
          ARRAY_BUFFER: 34962,
          STATIC_DRAW: 35044,
          FLOAT: 5126,
          TRIANGLES: 4,
          TEXTURE_2D: 3553,
          TEXTURE_WRAP_S: 10242,
          TEXTURE_WRAP_T: 10243,
          TEXTURE_MIN_FILTER: 10241,
          TEXTURE_MAG_FILTER: 10240,
          CLAMP_TO_EDGE: 33071,
          LINEAR: 9729,
          RGBA: 6408,
          UNSIGNED_BYTE: 5121,
          BLEND: 3042,
          SRC_ALPHA: 770,
          ONE_MINUS_SRC_ALPHA: 771,
          viewport: vi.fn(),
          createShader: vi.fn(() => ({})),
          shaderSource: vi.fn(),
          compileShader: vi.fn(),
          getShaderParameter: vi.fn(() => true),
          createProgram: vi.fn(() => ({})),
          attachShader: vi.fn(),
          linkProgram: vi.fn(),
          getProgramParameter: vi.fn(() => true),
          useProgram: vi.fn(),
          createBuffer: vi.fn(() => ({})),
          bindBuffer: vi.fn(),
          bufferData: vi.fn(),
          getAttribLocation: vi.fn(() => 0),
          enableVertexAttribArray: vi.fn(),
          vertexAttribPointer: vi.fn(),
          createTexture: vi.fn(() => ({})),
          bindTexture: vi.fn(),
          texParameteri: vi.fn(),
          getUniformLocation: vi.fn(() => ({})),
          uniform3f: vi.fn(),
          uniform1f: vi.fn(),
          enable: vi.fn(),
          blendFunc: vi.fn(),
          texImage2D: vi.fn(),
          drawArrays: vi.fn(),
        })),
      } as any;

      // Step 1: Create processor with default green screen
      const processor = createChromaKeyProcessor(mockVideo, mockCanvas);

      expect(processor).not.toBeNull();

      // Step 2: Start processing (begins requestAnimationFrame loop)
      processor!.start();

      // Step 3: Optionally adjust chroma key settings in real-time
      processor!.updateConfig({
        similarity: 0.5, // Increase green removal threshold
        smoothness: 0.15, // Smoother edges
      });

      // Step 4: Stop processing when done
      processor!.stop();

      expect(mockVideo.removeEventListener).toHaveBeenCalled();
    });

    it('should demonstrate custom color key usage', () => {
      // Example: Using blue screen instead of green screen
      const mockVideo = { videoWidth: 1280, videoHeight: 720 } as any;
      const mockCanvas = { getContext: vi.fn(() => null) } as any;

      const blueScreenConfig = {
        keyColor: [0.0, 0.0, 1.0] as [number, number, number], // Pure blue
        similarity: 0.4,
        smoothness: 0.1,
      };

      // This would create a blue screen processor in a real app
      // (returns null here due to mock returning null)
      const processor = createChromaKeyProcessor(
        mockVideo,
        mockCanvas,
        blueScreenConfig
      );

      expect(mockCanvas.getContext).toHaveBeenCalledWith('webgl2');
    });
  });
});
