import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// @ts-ignore - fft-js doesn't have TypeScript types
import FFT from 'fft-js';

export interface StressLevel {
  level: 'calm' | 'mild' | 'moderate' | 'high' | 'crisis';
  confidence: number;
  indicators: string[];
  timestamp: number;
}

export interface VoiceAnalysisResult {
  volume: number;
  pitch: number;
  speechRate: number;
  stressIndicators: {
    shouting: boolean;
    rapidSpeech: boolean;
    highPitch: boolean;
    irregularPattern: boolean;
  };
  rawMetrics: {
    rms: number;
    zcr: number;
    spectralCentroid: number;
    energyVariance: number;
  };
}

export class VoiceStressDetectionService {
  private recording: Audio.Recording | null = null;
  private isMonitoring = false;
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  private onStressDetected: (stressLevel: StressLevel) => void;
  private onError: (error: string) => void;

  constructor(
    onStressDetected: (stressLevel: StressLevel) => void,
    onError: (error: string) => void
  ) {
    this.onStressDetected = onStressDetected;
    this.onError = onError;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      this.onError('Failed to request microphone permissions');
      return false;
    }
  }

  async startMonitoring(): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        return true;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        this.onError('Microphone permission required for stress monitoring');
        return false;
      }

      // Configure audio for real-time analysis
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      this.isMonitoring = true;
      this.startAnalysisLoop();
      
      console.log('🎤 Voice stress monitoring started');
      return true;
    } catch (error) {
      this.onError('Failed to start voice monitoring');
      return false;
    }
  }

  async stopMonitoring(): Promise<void> {
    try {
      this.isMonitoring = false;
      
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }

      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }

      console.log('🎤 Voice stress monitoring stopped');
    } catch (error) {
      console.error('Error stopping voice monitoring:', error);
    }
  }

  private async startAnalysisLoop(): Promise<void> {
    const analyzeAudio = async () => {
      if (!this.isMonitoring) return;

      try {
        // Start a short recording for analysis
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          android: {
            extension: '.wav',
            outputFormat: Audio.AndroidOutputFormat.DEFAULT,
            audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
          },
          ios: {
            extension: '.wav',
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 1,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/wav',
            bitsPerSecond: 128000,
          },
        });

        await recording.startAsync();
        
        // Record for 3 seconds
        setTimeout(async () => {
          try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            
            if (uri) {
              await this.analyzeAudioFile(uri);
            }
          } catch (error) {
            console.error('Error in audio analysis:', error);
          }
        }, 3000);

      } catch (error) {
        console.error('Error starting audio recording:', error);
      }
    };

    // Analyze audio every 5 seconds
    this.analysisInterval = setInterval(analyzeAudio, 5000);
  }

  private async analyzeAudioFile(uri: string): Promise<void> {
    try {
      // Perform real-time audio analysis
      const analysisResult = await this.performVoiceAnalysis(uri);
      const stressLevel = this.calculateStressLevel(analysisResult);
      
      // Log analysis results for debugging
      console.log('📊 Voice Analysis:', {
        volume: analysisResult.volume.toFixed(1),
        pitch: analysisResult.pitch.toFixed(1) + ' Hz',
        speechRate: analysisResult.speechRate.toFixed(1) + ' wps',
        stressLevel: stressLevel.level,
        confidence: (stressLevel.confidence * 100).toFixed(0) + '%',
      });
      
      if (stressLevel.level !== 'calm') {
        this.onStressDetected(stressLevel);
      }
    } catch (error) {
      console.error('Error analyzing audio file:', error);
    }
  }

  private async performVoiceAnalysis(uri: string): Promise<VoiceAnalysisResult> {
    try {
      // Read the audio file
      const audioData = await this.readAudioFile(uri);
      
      if (!audioData || audioData.length === 0) {
        throw new Error('No audio data available');
      }

      // Perform real audio analysis
      const rms = this.calculateRMS(audioData);
      const zcr = this.calculateZeroCrossingRate(audioData);
      const pitch = this.estimatePitch(audioData, 44100);
      const spectralCentroid = this.calculateSpectralCentroid(audioData, 44100);
      const energyVariance = this.calculateEnergyVariance(audioData);
      
      // Convert RMS to volume (0-100 scale)
      const volume = Math.min(100, rms * 100);
      
      // SILENCE DETECTION - If volume is too low, it's silence/background noise
      const SILENCE_THRESHOLD = 5; // 5% volume threshold
      if (volume < SILENCE_THRESHOLD) {
        console.log('🔇 Silence detected - no speech activity');
        return this.getBaselineAnalysis();
      }
      
      // Voice Activity Detection - Check if this is actually speech
      const hasVoiceActivity = this.detectVoiceActivity(rms, zcr, spectralCentroid);
      if (!hasVoiceActivity) {
        console.log('🔇 No voice activity detected - background noise');
        return this.getBaselineAnalysis();
      }
      
      // Estimate speech rate using zero-crossing rate and energy variance
      // Higher ZCR and variance typically indicate faster speech
      const speechRate = this.estimateSpeechRate(zcr, energyVariance);
      
      // Determine stress indicators based on real metrics with better thresholds
      const stressIndicators = {
        shouting: volume > 70, // Increased from 60 - need louder for shouting
        rapidSpeech: speechRate > 5.0, // Increased from 4.5 - need faster for rapid
        highPitch: pitch > 250, // Increased from 220 - need higher for stress
        irregularPattern: energyVariance > 0.4, // Increased from 0.3 - need more variance
      };

      return {
        volume,
        pitch,
        speechRate,
        stressIndicators,
        rawMetrics: {
          rms,
          zcr,
          spectralCentroid,
          energyVariance,
        },
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      // Fallback to baseline if analysis fails
      return this.getBaselineAnalysis();
    }
  }

  private detectVoiceActivity(rms: number, zcr: number, spectralCentroid: number): boolean {
    // Voice activity detection based on multiple factors
    
    // 1. Energy threshold - voice has sufficient energy
    const hasEnergy = rms > 0.05; // 5% minimum energy
    
    // 2. Zero-crossing rate - voice is in typical range (not too high like noise)
    const zcrInVoiceRange = zcr > 0.02 && zcr < 0.25; // Typical voice range
    
    // 3. Spectral centroid - voice is in speech frequency range (300-3000 Hz)
    const inSpeechFrequencyRange = spectralCentroid > 300 && spectralCentroid < 4000;
    
    // Need at least 2 of 3 criteria to be considered voice
    const criteriaCount = [hasEnergy, zcrInVoiceRange, inSpeechFrequencyRange].filter(Boolean).length;
    
    return criteriaCount >= 2;
  }

  private async readAudioFile(uri: string): Promise<number[]> {
    try {
      // Read the WAV file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      // Convert base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Parse WAV header and extract PCM data
      const audioData = this.parseWAVFile(bytes);
      return audioData;
    } catch (error) {
      console.error('Error reading audio file:', error);
      return [];
    }
  }

  private parseWAVFile(bytes: Uint8Array): number[] {
    try {
      // WAV file format:
      // 0-3: "RIFF"
      // 4-7: File size
      // 8-11: "WAVE"
      // 12-15: "fmt "
      // 16-19: Format chunk size
      // 20-21: Audio format (1 = PCM)
      // 22-23: Number of channels
      // 24-27: Sample rate
      // 28-31: Byte rate
      // 32-33: Block align
      // 34-35: Bits per sample
      // 36-39: "data"
      // 40-43: Data size
      // 44+: Audio data

      const dataOffset = 44; // Standard WAV header size
      const audioData: number[] = [];
      
      // Read 16-bit PCM samples
      for (let i = dataOffset; i < bytes.length - 1; i += 2) {
        // Read 16-bit sample (little-endian)
        const sample = bytes[i] | (bytes[i + 1] << 8);
        // Convert to signed 16-bit (-32768 to 32767)
        const signedSample = sample > 32767 ? sample - 65536 : sample;
        // Normalize to -1 to 1
        audioData.push(signedSample / 32768);
      }
      
      return audioData;
    } catch (error) {
      console.error('Error parsing WAV file:', error);
      return [];
    }
  }

  private calculateRMS(samples: number[]): number {
    if (samples.length === 0) return 0;
    
    const sumSquares = samples.reduce((sum, sample) => sum + sample * sample, 0);
    return Math.sqrt(sumSquares / samples.length);
  }

  private calculateZeroCrossingRate(samples: number[]): number {
    if (samples.length < 2) return 0;
    
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / samples.length;
  }

  private estimatePitch(samples: number[], sampleRate: number): number {
    try {
      // Use autocorrelation to estimate pitch
      const minPeriod = Math.floor(sampleRate / 500); // 500 Hz max
      const maxPeriod = Math.floor(sampleRate / 50);  // 50 Hz min
      
      let bestCorrelation = -1;
      let bestPeriod = minPeriod;
      
      // Autocorrelation
      for (let period = minPeriod; period < Math.min(maxPeriod, samples.length / 2); period++) {
        let correlation = 0;
        let count = 0;
        
        for (let i = 0; i < samples.length - period; i++) {
          correlation += samples[i] * samples[i + period];
          count++;
        }
        
        correlation /= count;
        
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPeriod = period;
        }
      }
      
      // Convert period to frequency (Hz)
      const pitch = sampleRate / bestPeriod;
      
      // Return pitch if it's in a reasonable voice range (50-500 Hz)
      return pitch >= 50 && pitch <= 500 ? pitch : 150; // Default to 150 Hz if out of range
    } catch (error) {
      console.error('Error estimating pitch:', error);
      return 150; // Default pitch
    }
  }

  private calculateSpectralCentroid(samples: number[], sampleRate: number): number {
    try {
      // Use FFT to analyze frequency spectrum
      const fftSize = Math.pow(2, Math.floor(Math.log2(samples.length)));
      const fftInput = samples.slice(0, fftSize);
      
      // Perform FFT
      const phasors = FFT.fft(fftInput);
      const magnitudes = FFT.util.fftMag(phasors);
      
      // Calculate spectral centroid
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 0; i < magnitudes.length / 2; i++) {
        const frequency = (i * sampleRate) / fftSize;
        numerator += frequency * magnitudes[i];
        denominator += magnitudes[i];
      }
      
      return denominator > 0 ? numerator / denominator : 0;
    } catch (error) {
      console.error('Error calculating spectral centroid:', error);
      return 0;
    }
  }

  private calculateEnergyVariance(samples: number[]): number {
    if (samples.length === 0) return 0;
    
    // Split into frames and calculate energy variance
    const frameSize = 1024;
    const energies: number[] = [];
    
    for (let i = 0; i < samples.length - frameSize; i += frameSize) {
      const frame = samples.slice(i, i + frameSize);
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frameSize;
      energies.push(energy);
    }
    
    if (energies.length < 2) return 0;
    
    // Calculate variance
    const mean = energies.reduce((sum, e) => sum + e, 0) / energies.length;
    const variance = energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / energies.length;
    
    return Math.sqrt(variance);
  }

  private estimateSpeechRate(zcr: number, energyVariance: number): number {
    // Empirical formula based on ZCR and energy variance
    // Typical speech has ZCR: 0.03-0.15, variance: 0.05-0.3
    
    // Normalize ZCR (0.03-0.15 -> 0-1 scale)
    const normalizedZCR = Math.max(0, Math.min(1, (zcr - 0.03) / 0.12));
    
    // Normalize energy variance (0.05-0.3 -> 0-1 scale)  
    const normalizedVariance = Math.max(0, Math.min(1, (energyVariance - 0.05) / 0.25));
    
    // Typical speech rate: 2-3.5 wps (words per second)
    // Fast speech: 4-5 wps
    // Very fast/stressed: 5-6 wps
    const baseRate = 2.0; // Calm speaking rate
    const zcrContribution = normalizedZCR * 2.0; // Up to +2 wps
    const varianceContribution = normalizedVariance * 1.5; // Up to +1.5 wps
    
    const speechRate = baseRate + zcrContribution + varianceContribution;
    
    // Clamp to reasonable range
    return Math.max(1, Math.min(6, speechRate));
  }

  private getBaselineAnalysis(): VoiceAnalysisResult {
    // Return baseline "calm" or "silence" analysis
    return {
      volume: 2, // Very low - silence/background
      pitch: 150,
      speechRate: 2.0,
      stressIndicators: {
        shouting: false,
        rapidSpeech: false,
        highPitch: false,
        irregularPattern: false,
      },
      rawMetrics: {
        rms: 0.02,
        zcr: 0.05,
        spectralCentroid: 1000,
        energyVariance: 0.05,
      },
    };
  }

  private calculateStressLevel(analysis: VoiceAnalysisResult): StressLevel {
    const { volume, pitch, speechRate, stressIndicators } = analysis;
    const indicators: string[] = [];
    let stressScore = 0;

    // Analyze shouting (high volume)
    if (stressIndicators.shouting) {
      indicators.push('Elevated voice volume detected');
      stressScore += 3;
    }

    // Analyze rapid speech
    if (stressIndicators.rapidSpeech) {
      indicators.push('Rapid speech pattern detected');
      stressScore += 2;
    }

    // Analyze high pitch
    if (stressIndicators.highPitch) {
      indicators.push('Elevated pitch detected');
      stressScore += 2;
    }

    // Analyze irregular patterns
    if (stressIndicators.irregularPattern) {
      indicators.push('Irregular speech pattern detected');
      stressScore += 1;
    }

    // Determine stress level
    let level: StressLevel['level'] = 'calm';
    let confidence = 0;

    if (stressScore >= 6) {
      level = 'crisis';
      confidence = Math.min(0.9, stressScore / 8);
    } else if (stressScore >= 4) {
      level = 'high';
      confidence = Math.min(0.8, stressScore / 6);
    } else if (stressScore >= 2) {
      level = 'moderate';
      confidence = Math.min(0.7, stressScore / 4);
    } else if (stressScore >= 1) {
      level = 'mild';
      confidence = Math.min(0.6, stressScore / 2);
    } else {
      level = 'calm';
      confidence = 0.1;
    }

    return {
      level,
      confidence,
      indicators,
      timestamp: Date.now(),
    };
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}
