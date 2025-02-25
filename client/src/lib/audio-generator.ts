// Constants for musical parameters
const SCALES = {
  happy: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  calm: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  growth: ['C', 'D', 'E', 'G', 'A'],
};

const BASE_FREQUENCIES = {
  'C': 261.63,
  'D': 293.66,
  'Eb': 311.13,
  'E': 329.63,
  'F': 349.23,
  'G': 392.00,
  'Ab': 415.30,
  'A': 440.00,
  'Bb': 466.16,
  'B': 493.88,
};

interface SoundParameters {
  bpm: number;
  key: string;
  mood: string;
  duration: number;
}

export class PlantSoundGenerator {
  private audioContext: AudioContext;
  private gainNode: GainNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  // Generate parameters based on plant characteristics
  generateParameters(plant: any): SoundParameters {
    const bpm = this.calculateBPM(plant.wateringFrequency);
    const key = this.determineKey(plant.sunlightNeeds);
    const mood = this.determineMood(plant);
    
    return {
      bpm,
      key,
      mood,
      duration: 60, // 1 minute of music
    };
  }

  private calculateBPM(wateringFrequency: number): number {
    // Slower BPM for plants that need less frequent watering
    return Math.max(60, Math.min(120, 120 - (wateringFrequency * 2)));
  }

  private determineKey(sunlightNeeds: string): string {
    // Choose key based on light requirements
    switch (sunlightNeeds) {
      case 'high': return 'C';
      case 'medium': return 'G';
      case 'low': return 'F';
      default: return 'C';
    }
  }

  private determineMood(plant: any): string {
    // Determine mood based on plant characteristics
    if (plant.lastWatered && Date.now() - new Date(plant.lastWatered).getTime() < plant.wateringFrequency * 86400000) {
      return 'happy';
    }
    return 'calm';
  }

  // Create oscillator node for a note
  private createNote(frequency: number, startTime: number, duration: number): void {
    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  // Generate ambient music
  async generateMusic(params: SoundParameters): Promise<void> {
    const scale = SCALES[params.mood as keyof typeof SCALES];
    const noteDuration = 60 / params.bpm;
    
    for (let time = 0; time < params.duration; time += noteDuration) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const frequency = BASE_FREQUENCIES[note as keyof typeof BASE_FREQUENCIES];
      
      this.createNote(frequency, this.audioContext.currentTime + time, noteDuration);
    }
  }

  // Start/stop playback
  play(): void {
    this.gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
  }

  pause(): void {
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
  }
}

export const plantSoundGenerator = new PlantSoundGenerator();
