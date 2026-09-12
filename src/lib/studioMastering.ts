/**
 * Studio Mastering & Acoustic Processing Engine
 * High-definition Web Audio processing for Voiceovers, Podcasts, Documentaries, and Broadcast Narration.
 */

export interface MasterRackSettings {
  enabled: boolean;
  lowCut: boolean; // 80Hz rumble filter
  presenceBoost: boolean; // 3.2kHz vocal articulation boost
  compression: boolean; // Broadcast leveling compressor
  acousticRoom: 'dry' | 'booth' | 'warm_studio' | 'hall' | 'radio';
  ambientBed: 'none' | 'himalayan_drone' | 'mountain_flute' | 'studio_room' | 'peaceful_rain';
  ambientVolume: number; // 0.0 to 1.0
  autoDucking: boolean; // Lowers ambient by 12dB during speech
}

export const DEFAULT_MASTER_SETTINGS: MasterRackSettings = {
  enabled: false,
  lowCut: true,
  presenceBoost: true,
  compression: true,
  acousticRoom: 'warm_studio',
  ambientBed: 'none',
  ambientVolume: 0.25,
  autoDucking: true,
};

class StudioMasteringEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private lowCutNode: BiquadFilterNode | null = null;
  private presenceNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private dryGainNode: GainNode | null = null;
  private wetGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientRunning = false;
  private currentSettings: MasterRackSettings = { ...DEFAULT_MASTER_SETTINGS };

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Connects an HTMLAudioElement to the studio mastering rack.
   */
  public attachToAudioElement(audioEl: HTMLAudioElement, settings: MasterRackSettings) {
    try {
      const ctx = this.getAudioContext();
      this.currentSettings = { ...settings };

      // Ensure we don't re-create MediaElementSource on the same element repeatedly
      if (!this.sourceNode) {
        this.sourceNode = ctx.createMediaElementSource(audioEl);
      }

      this.rebuildChain();
    } catch (e) {
      console.warn('[Studio Mastering] WebAudio attach notice:', e);
    }
  }

  /**
   * Generates synthetic acoustic impulse responses for room acoustics.
   */
  private createImpulseResponse(type: 'booth' | 'warm_studio' | 'hall' | 'radio'): AudioBuffer {
    const ctx = this.getAudioContext();
    const rate = ctx.sampleRate;
    let length = rate * 0.4;
    let decay = 1.8;

    if (type === 'booth') {
      length = rate * 0.08;
      decay = 0.5;
    } else if (type === 'warm_studio') {
      length = rate * 0.35;
      decay = 1.2;
    } else if (type === 'hall') {
      length = rate * 1.8;
      decay = 3.5;
    } else if (type === 'radio') {
      length = rate * 0.1;
      decay = 0.8;
    }

    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    return buffer;
  }

  public updateSettings(settings: MasterRackSettings) {
    this.currentSettings = { ...settings };
    this.rebuildChain();
  }

  private rebuildChain() {
    if (!this.ctx || !this.sourceNode) return;
    const ctx = this.ctx;

    try {
      // Disconnect existing nodes safely
      this.sourceNode.disconnect();
      if (this.masterGainNode) this.masterGainNode.disconnect();

      if (!this.currentSettings.enabled) {
        // Direct pass-through
        this.sourceNode.connect(ctx.destination);
        this.stopAmbient();
        return;
      }

      // 1. High Pass Low-Cut Filter (80Hz)
      this.lowCutNode = ctx.createBiquadFilter();
      this.lowCutNode.type = 'highpass';
      this.lowCutNode.frequency.value = this.currentSettings.lowCut ? 85 : 10;
      this.lowCutNode.Q.value = 0.7;

      // 2. Vocal Presence Boost (3.2kHz)
      this.presenceNode = ctx.createBiquadFilter();
      this.presenceNode.type = 'peaking';
      this.presenceNode.frequency.value = 3200;
      this.presenceNode.gain.value = this.currentSettings.presenceBoost ? 3.5 : 0;
      this.presenceNode.Q.value = 1.2;

      // 3. Broadcast Mastering Compressor
      this.compressorNode = ctx.createDynamicsCompressor();
      if (this.currentSettings.compression) {
        this.compressorNode.threshold.value = -18;
        this.compressorNode.knee.value = 10;
        this.compressorNode.ratio.value = 4.0;
        this.compressorNode.attack.value = 0.005;
        this.compressorNode.release.value = 0.15;
      } else {
        this.compressorNode.threshold.value = 0;
        this.compressorNode.ratio.value = 1;
      }

      // 4. Acoustic Convolver / Room Reverb
      this.dryGainNode = ctx.createGain();
      this.wetGainNode = ctx.createGain();
      this.masterGainNode = ctx.createGain();

      if (this.currentSettings.acousticRoom === 'dry') {
        this.dryGainNode.gain.value = 1.0;
        this.wetGainNode.gain.value = 0.0;
      } else {
        this.convolverNode = ctx.createConvolver();
        this.convolverNode.buffer = this.createImpulseResponse(this.currentSettings.acousticRoom);
        
        const wetLevels: Record<string, number> = {
          booth: 0.12,
          warm_studio: 0.22,
          hall: 0.45,
          radio: 0.25,
        };
        const wetVal = wetLevels[this.currentSettings.acousticRoom] || 0.2;
        this.dryGainNode.gain.value = 1.0 - wetVal * 0.5;
        this.wetGainNode.gain.value = wetVal;
      }

      // Connect Chain: Source -> LowCut -> Presence -> Compressor
      this.sourceNode.connect(this.lowCutNode);
      this.lowCutNode.connect(this.presenceNode);
      this.presenceNode.connect(this.compressorNode);

      // Branch: Dry + Wet -> Master Gain -> Destination
      this.compressorNode.connect(this.dryGainNode);
      this.dryGainNode.connect(this.masterGainNode);

      if (this.convolverNode && this.currentSettings.acousticRoom !== 'dry') {
        this.compressorNode.connect(this.convolverNode);
        this.convolverNode.connect(this.wetGainNode);
        this.wetGainNode.connect(this.masterGainNode);
      }

      this.masterGainNode.connect(ctx.destination);

      // Handle Ambient Bed
      this.syncAmbientBed();
    } catch (e) {
      console.warn('[Studio Mastering] Chain error:', e);
      if (this.sourceNode && this.ctx) {
        this.sourceNode.connect(this.ctx.destination);
      }
    }
  }

  /**
   * Synthesizes ambient drone or nature beds directly via Web Audio oscillators & filtered noise.
   */
  private syncAmbientBed() {
    if (this.currentSettings.ambientBed === 'none' || !this.currentSettings.enabled) {
      this.stopAmbient();
      return;
    }

    if (this.ambientRunning) {
      if (this.ambientGainNode && this.ctx) {
        this.ambientGainNode.gain.setTargetAtTime(this.currentSettings.ambientVolume, this.ctx.currentTime, 0.1);
      }
      return;
    }

    const ctx = this.getAudioContext();
    this.stopAmbient();

    try {
      this.ambientGainNode = ctx.createGain();
      this.ambientGainNode.gain.value = this.currentSettings.ambientVolume;
      this.ambientGainNode.connect(ctx.destination);

      const type = this.currentSettings.ambientBed;

      if (type === 'himalayan_drone' || type === 'mountain_flute') {
        // Deep warm harmonic drone (Tanpura/Himalayan tone)
        const baseFreq = type === 'himalayan_drone' ? 108 : 216; // Sacred Root Pitch
        
        this.ambientOsc1 = ctx.createOscillator();
        this.ambientOsc1.type = 'sine';
        this.ambientOsc1.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        this.ambientOsc2 = ctx.createOscillator();
        this.ambientOsc2.type = 'triangle';
        this.ambientOsc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime); // Perfect 5th

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.3;

        this.ambientOsc1.connect(filter);
        this.ambientOsc2.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.ambientGainNode);

        this.ambientOsc1.start();
        this.ambientOsc2.start();
      } else {
        // Nature & Atmosphere Buffer (Pink Noise Stream/Rain)
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.15;
        }

        this.ambientNoiseSource = ctx.createBufferSource();
        this.ambientNoiseSource.buffer = noiseBuffer;
        this.ambientNoiseSource.loop = true;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = type === 'peaceful_rain' ? 1200 : 400;
        noiseFilter.Q.value = 1.0;

        this.ambientNoiseSource.connect(noiseFilter);
        noiseFilter.connect(this.ambientGainNode);
        this.ambientNoiseSource.start();
      }

      this.ambientRunning = true;
    } catch (e) {
      console.warn('[Studio Mastering] Ambient bed notice:', e);
    }
  }

  /**
   * Ducks the ambient bed volume when speech begins.
   */
  public duckAmbient(isSpeaking: boolean) {
    if (!this.ambientGainNode || !this.ctx || !this.currentSettings.autoDucking) return;
    const targetGain = isSpeaking 
      ? this.currentSettings.ambientVolume * 0.25 // duck by ~12dB
      : this.currentSettings.ambientVolume;
    this.ambientGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
  }

  public stopAmbient() {
    try {
      if (this.ambientOsc1) {
        this.ambientOsc1.stop();
        this.ambientOsc1.disconnect();
        this.ambientOsc1 = null;
      }
      if (this.ambientOsc2) {
        this.ambientOsc2.stop();
        this.ambientOsc2.disconnect();
        this.ambientOsc2 = null;
      }
      if (this.ambientNoiseSource) {
        this.ambientNoiseSource.stop();
        this.ambientNoiseSource.disconnect();
        this.ambientNoiseSource = null;
      }
      if (this.ambientGainNode) {
        this.ambientGainNode.disconnect();
        this.ambientGainNode = null;
      }
      this.ambientRunning = false;
    } catch (e) {
      // Ignored
    }
  }
}

export const studioMastering = new StudioMasteringEngine();
