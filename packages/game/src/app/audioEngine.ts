// ============================================================================
// ROCK SOUNDTRACK ENGINE - Inspired by AC/DC & Guns N' Roses
// ============================================================================

export class RockAudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentTrack: 'intro' | 'exploration' | 'combat' | 'victory' | 'boss' | null = null;
  private isPlaying = false;
  private oscillators: OscillatorNode[] = [];
  private scheduledNotes: number[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // Master volume
      this.masterGain.connect(this.audioContext.destination);
    }
  }

  // Initialize audio context (must be called after user interaction)
  async init() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Stop all currently playing sounds
  stop() {
    this.isPlaying = false;
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    this.oscillators = [];
    this.scheduledNotes.forEach(id => clearTimeout(id));
    this.scheduledNotes = [];
  }

  // Play a power chord (root, fifth, octave)
  private playPowerChord(frequency: number, duration: number, startTime: number, gain: number = 0.15) {
    if (!this.audioContext || !this.masterGain) return;

    const notes = [frequency, frequency * 1.5, frequency * 2]; // Root, fifth, octave
    
    notes.forEach(freq => {
      // Oscillator for the note
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      const distortion = this.audioContext!.createWaveShaper();
      
      // Distortion curve for that rock sound
      const curve = this.makeDistortionCurve(400);
      if (curve) (distortion as any).curve = curve;
      
      osc.type = 'sawtooth'; // Sawtooth for that gritty guitar sound
      osc.frequency.value = freq;
      
      // ADSR envelope
      oscGain.gain.setValueAtTime(0, startTime);
      oscGain.gain.linearRampToValueAtTime(gain, startTime + 0.01); // Attack
      oscGain.gain.setValueAtTime(gain * 0.7, startTime + 0.1); // Decay
      oscGain.gain.setValueAtTime(gain * 0.5, startTime + duration - 0.1); // Sustain
      oscGain.gain.linearRampToValueAtTime(0, startTime + duration); // Release
      
      osc.connect(distortion);
      distortion.connect(oscGain);
      oscGain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      this.oscillators.push(osc);
    });
  }

  // Create distortion curve for guitar effect
  private makeDistortionCurve(amount: number): Float32Array | null {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    
    return curve;
  }

  // Play drum hit (kick, snare, or hi-hat)
  private playDrum(type: 'kick' | 'snare' | 'hihat', startTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    if (type === 'kick') {
      osc.frequency.setValueAtTime(150, startTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      gain.gain.setValueAtTime(1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      filter.type = 'lowpass';
      filter.frequency.value = 200;
    } else if (type === 'snare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, startTime);
      gain.gain.setValueAtTime(0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      filter.type = 'highpass';
      filter.frequency.value = 1000;
    } else { // hihat
      osc.type = 'square';
      osc.frequency.setValueAtTime(10000, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
      filter.type = 'highpass';
      filter.frequency.value = 7000;
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + 0.5);
    
    this.oscillators.push(osc);
  }

  // Play bass line
  private playBass(frequency: number, duration: number, startTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = frequency / 2; // Bass is an octave lower
    
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gain.gain.setValueAtTime(0.2, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
    
    this.oscillators.push(osc);
  }

  // INTRO TRACK - Epic power ballad intro (like "Welcome to the Jungle")
  playIntro() {
    this.stop();
    this.currentTrack = 'intro';
    this.isPlaying = true;
    
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const beatDuration = 0.5; // 120 BPM
    
    // Intro riff pattern (E5 - G5 - A5 - E5)
    const riff = [
      { freq: 82.41, beat: 0 },   // E2
      { freq: 82.41, beat: 1 },
      { freq: 98.00, beat: 2 },   // G2
      { freq: 110.00, beat: 3 },  // A2
      { freq: 82.41, beat: 4 },   // E2
      { freq: 82.41, beat: 5 },
      { freq: 98.00, beat: 6 },
      { freq: 110.00, beat: 7 },
    ];

    // Play the riff in a loop
    const playLoop = (loopCount: number) => {
      if (!this.isPlaying || loopCount > 8) return;
      
      riff.forEach(note => {
        const startTime = now + (loopCount * 8 + note.beat) * beatDuration;
        this.playPowerChord(note.freq, beatDuration * 0.9, startTime, 0.12);
        this.playBass(note.freq, beatDuration * 0.9, startTime);
        
        // Drums
        if (note.beat % 2 === 0) this.playDrum('kick', startTime);
        if (note.beat % 4 === 2) this.playDrum('snare', startTime);
        this.playDrum('hihat', startTime);
      });
      
      const timeoutId = window.setTimeout(() => playLoop(loopCount + 1), 8 * beatDuration * 1000);
      this.scheduledNotes.push(timeoutId);
    };
    
    playLoop(0);
  }

  // EXPLORATION TRACK - Bluesy rock groove (like "Sweet Child O' Mine" intro)
  playExploration() {
    this.stop();
    this.currentTrack = 'exploration';
    this.isPlaying = true;
    
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const beatDuration = 0.4; // 150 BPM
    
    // Melodic arpeggio pattern
    const melody = [
      { freq: 146.83, beat: 0 },   // D3
      { freq: 196.00, beat: 0.5 }, // G3
      { freq: 246.94, beat: 1 },   // B3
      { freq: 196.00, beat: 1.5 }, // G3
      { freq: 220.00, beat: 2 },   // A3
      { freq: 293.66, beat: 2.5 }, // D4
      { freq: 220.00, beat: 3 },   // A3
      { freq: 196.00, beat: 3.5 }, // G3
    ];

    const playLoop = (loopCount: number) => {
      if (!this.isPlaying || loopCount > 16) return;
      
      melody.forEach(note => {
        const startTime = now + (loopCount * 4 + note.beat) * beatDuration;
        this.playPowerChord(note.freq, beatDuration * 0.4, startTime, 0.08);
        
        // Bass on downbeats
        if (note.beat % 1 === 0) {
          this.playBass(note.freq, beatDuration * 0.9, startTime);
        }
        
        // Drums
        if (note.beat % 2 === 0) this.playDrum('kick', startTime);
        if (note.beat === 2) this.playDrum('snare', startTime);
        if (note.beat % 0.5 === 0) this.playDrum('hihat', startTime);
      });
      
      const timeoutId = window.setTimeout(() => playLoop(loopCount + 1), 4 * beatDuration * 1000);
      this.scheduledNotes.push(timeoutId);
    };
    
    playLoop(0);
  }

  // COMBAT TRACK - Fast aggressive riff (like "Thunderstruck")
  playCombat() {
    this.stop();
    this.currentTrack = 'combat';
    this.isPlaying = true;
    
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const beatDuration = 0.3; // 200 BPM - fast!
    
    // Aggressive power chord progression
    const riff = [
      { freq: 82.41, beat: 0 },    // E2
      { freq: 82.41, beat: 0.5 },
      { freq: 82.41, beat: 1 },
      { freq: 110.00, beat: 1.5 }, // A2
      { freq: 82.41, beat: 2 },
      { freq: 82.41, beat: 2.5 },
      { freq: 73.42, beat: 3 },    // D2
      { freq: 82.41, beat: 3.5 },
    ];

    const playLoop = (loopCount: number) => {
      if (!this.isPlaying || loopCount > 20) return;
      
      riff.forEach(note => {
        const startTime = now + (loopCount * 4 + note.beat) * beatDuration;
        this.playPowerChord(note.freq, beatDuration * 0.8, startTime, 0.18);
        this.playBass(note.freq, beatDuration * 0.8, startTime);
        
        // Heavy drums
        if (note.beat % 1 === 0) this.playDrum('kick', startTime);
        if (note.beat % 2 === 1) this.playDrum('snare', startTime);
        if (note.beat % 0.5 === 0) this.playDrum('hihat', startTime);
      });
      
      const timeoutId = window.setTimeout(() => playLoop(loopCount + 1), 4 * beatDuration * 1000);
      this.scheduledNotes.push(timeoutId);
    };
    
    playLoop(0);
  }

  // VICTORY TRACK - Triumphant power chord anthem
  playVictory() {
    this.stop();
    this.currentTrack = 'victory';
    this.isPlaying = true;
    
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const beatDuration = 0.5;
    
    // Victory fanfare
    const fanfare = [
      { freq: 82.41, beat: 0 },    // E
      { freq: 110.00, beat: 1 },   // A
      { freq: 146.83, beat: 2 },   // D
      { freq: 196.00, beat: 3 },   // G
      { freq: 82.41, beat: 4 },    // E (octave up)
    ];

    fanfare.forEach(note => {
      const startTime = now + note.beat * beatDuration;
      this.playPowerChord(note.freq, beatDuration * 1.5, startTime, 0.2);
      this.playBass(note.freq, beatDuration * 1.5, startTime);
      this.playDrum('kick', startTime);
      if (note.beat % 2 === 1) this.playDrum('snare', startTime);
    });
  }

  // BOSS TRACK - Epic heavy metal (like "Back in Black")
  playBoss() {
    this.stop();
    this.currentTrack = 'boss';
    this.isPlaying = true;
    
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const beatDuration = 0.35; // 170 BPM
    
    // Heavy boss riff
    const riff = [
      { freq: 65.41, beat: 0 },    // C2
      { freq: 65.41, beat: 0.5 },
      { freq: 73.42, beat: 1 },    // D2
      { freq: 65.41, beat: 1.5 },
      { freq: 87.31, beat: 2 },    // F2
      { freq: 87.31, beat: 2.5 },
      { freq: 73.42, beat: 3 },    // D2
      { freq: 65.41, beat: 3.5 },
    ];

    const playLoop = (loopCount: number) => {
      if (!this.isPlaying || loopCount > 24) return;
      
      riff.forEach(note => {
        const startTime = now + (loopCount * 4 + note.beat) * beatDuration;
        this.playPowerChord(note.freq, beatDuration * 0.9, startTime, 0.2);
        this.playBass(note.freq, beatDuration * 0.9, startTime);
        
        // Thunderous drums
        if (note.beat % 0.5 === 0) this.playDrum('kick', startTime);
        if (note.beat % 2 === 1) this.playDrum('snare', startTime);
        this.playDrum('hihat', startTime);
      });
      
      const timeoutId = window.setTimeout(() => playLoop(loopCount + 1), 4 * beatDuration * 1000);
      this.scheduledNotes.push(timeoutId);
    };
    
    playLoop(0);
  }

  // Set master volume (0-1)
  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}






