// Hardware Acceleration & Media Engine Capability Detector

export interface HardwareCapabilities {
  webglSupported: boolean;
  webgl2Supported: boolean;
  webglVersion: string;
  gpuVendor: string;
  gpuRenderer: string;
  isSoftwareRasterizer: boolean;
  isHardwareAccelerated: boolean;
  maxTextureSize: number;
  mediaRecorderSupported: boolean;
  supportedCodecs: string[];
  canvasCaptureStreamSupported: boolean;
  webAudioSupported: boolean;
  hardwareConcurrency: number;
  deviceMemoryGb?: number;
  statusTier: 'optimal' | 'warning_software' | 'critical_unsupported';
  statusLabel: string;
  recommendation?: string;
}

export function detectHardwareCapabilities(): HardwareCapabilities {
  if (typeof window === 'undefined') {
    return {
      webglSupported: false,
      webgl2Supported: false,
      webglVersion: 'Unavailable',
      gpuVendor: 'Unknown',
      gpuRenderer: 'Unknown',
      isSoftwareRasterizer: false,
      isHardwareAccelerated: false,
      maxTextureSize: 0,
      mediaRecorderSupported: false,
      supportedCodecs: [],
      canvasCaptureStreamSupported: false,
      webAudioSupported: false,
      hardwareConcurrency: 4,
      statusTier: 'critical_unsupported',
      statusLabel: 'Server Environment',
    };
  }

  let webglSupported = false;
  let webgl2Supported = false;
  let webglVersion = 'Unavailable';
  let gpuVendor = 'Unknown';
  let gpuRenderer = 'Unknown';
  let maxTextureSize = 0;
  let isSoftwareRasterizer = false;

  try {
    const canvas = document.createElement('canvas');
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

    // Try WebGL2 first
    try {
      gl = canvas.getContext('webgl2');
      if (gl) {
        webgl2Supported = true;
        webglSupported = true;
        webglVersion = 'WebGL 2.0';
      }
    } catch {}

    // Fallback to WebGL1
    if (!gl) {
      try {
        gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as any);
        if (gl) {
          webglSupported = true;
          webglVersion = 'WebGL 1.0';
        }
      } catch {}
    }

    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Generic GPU';
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Generic Hardware Renderer';
      } else {
        gpuVendor = gl.getParameter(gl.VENDOR) || 'Standard WebGL Vendor';
        gpuRenderer = gl.getParameter(gl.RENDERER) || 'Standard WebGL Renderer';
      }

      // Detect software rasterizers (e.g. SwiftShader, llvmpipe, Mesa Software, Software Rasterizer)
      const lowerRenderer = (gpuRenderer + ' ' + gpuVendor).toLowerCase();
      if (
        lowerRenderer.includes('swiftshader') ||
        lowerRenderer.includes('llvmpipe') ||
        lowerRenderer.includes('software rasterizer') ||
        lowerRenderer.includes('mesa software') ||
        lowerRenderer.includes('microsoft basic render')
      ) {
        isSoftwareRasterizer = true;
      }
    }
  } catch (e) {
    console.warn('[HardwareDetector] WebGL probe notice:', e);
  }

  // MediaRecorder probe
  const mediaRecorderSupported = typeof window.MediaRecorder !== 'undefined';
  const supportedCodecs: string[] = [];

  if (mediaRecorderSupported && typeof MediaRecorder.isTypeSupported === 'function') {
    const candidateCodecs = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm',
    ];

    candidateCodecs.forEach((codec) => {
      try {
        if (MediaRecorder.isTypeSupported(codec)) {
          supportedCodecs.push(codec);
        }
      } catch {}
    });
  }

  const canvasCaptureStreamSupported = typeof HTMLCanvasElement.prototype.captureStream === 'function';
  const webAudioSupported = typeof window.AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemoryGb = (navigator as any).deviceMemory;

  const isHardwareAccelerated = webglSupported && !isSoftwareRasterizer;

  let statusTier: 'optimal' | 'warning_software' | 'critical_unsupported' = 'optimal';
  let statusLabel = 'Hardware Accelerated';
  let recommendation: string | undefined;

  if (!webglSupported || !mediaRecorderSupported || !canvasCaptureStreamSupported) {
    statusTier = 'critical_unsupported';
    statusLabel = 'Acceleration Disabled';
    recommendation = 'WebGL or MediaRecorder is disabled in browser settings. Video rendering will rely on server FFmpeg transcoding.';
  } else if (isSoftwareRasterizer) {
    statusTier = 'warning_software';
    statusLabel = 'Software Rasterizer (CPU)';
    recommendation = 'Hardware GPU acceleration is disabled or running via SwiftShader/llvmpipe. Canvas effects will use CPU cycles.';
  } else if (webgl2Supported) {
    statusTier = 'optimal';
    statusLabel = 'GPU Accelerated (WebGL 2.0)';
  } else {
    statusTier = 'optimal';
    statusLabel = 'GPU Accelerated (WebGL 1.0)';
  }

  return {
    webglSupported,
    webgl2Supported,
    webglVersion,
    gpuVendor,
    gpuRenderer,
    isSoftwareRasterizer,
    isHardwareAccelerated,
    maxTextureSize,
    mediaRecorderSupported,
    supportedCodecs,
    canvasCaptureStreamSupported,
    webAudioSupported,
    hardwareConcurrency,
    deviceMemoryGb,
    statusTier,
    statusLabel,
    recommendation,
  };
}
