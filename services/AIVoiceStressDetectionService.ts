import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// @ts-ignore - fft-js doesn't have TypeScript types
import FFT from 'fft-js';

// ONNX Runtime types (optional - only used if model is loaded)
type InferenceSession = any;
type Tensor = any;

export interface StressLevel {
  level: 'calm' | 'mild' | 'moderate' | 'high' | 'crisis';
  confidence: number;
  indicators: string[];
  timestamp: number;
  emotions?: {
    calm: number;
    stressed: number;
    angry: number;
    fearful: number;
    sad: number;
  };
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
  aiPrediction?: {
    emotions: number[];
    modelConfidence: number;
  };
}

export class AIVoiceStressDetectionService {
  private recording: Audio.Recording | null = null;
  private isMonitoring = false;
  private analysisInterval: ReturnType<typeof setInterval> | null = null;
  private onStressDetected: (stressLevel: StressLevel) => void;
  private onError: (error: string) => void;
  private model: InferenceSession | null = null;
  private modelLoaded = false;

  constructor(
    onStressDetected: (stressLevel: StressLevel) => void,
    onError: (error: string) => void
  ) {
    this.onStressDetected = onStressDetected;
    this.onError = onError;
    this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      // Check if model exists first
      const modelPath = `${FileSystem.documentDirectory}emotion_model.onnx`;
      const modelExists = await FileSystem.getInfoAsync(modelPath);
      
      if (!modelExists.exists) {
        console.log('⚠️ No AI model found - using signal processing fallback');
        this.modelLoaded = false;
        return;
      }
      
      // Only load ONNX if model exists
      try {
        const { InferenceSession } = await import('onnxruntime-react-native');
        this.model = await InferenceSession.create(modelPath);
        this.modelLoaded = true;
        console.log('✅ AI model loaded successfully');
      } catch (onnxError) {
        console.log('⚠️ ONNX Runtime not available - using signal processing fallback');
        this.modelLoaded = false;
      }
    } catch (error) {
      console.log('⚠️ Failed to load AI model - using signal processing fallback');
      this.modelLoaded = false;
    }
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

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });

      this.isMonitoring = true;
      this.startAnalysisLoop();
      
      console.log(`🎤 Voice stress monitoring started (${this.modelLoaded ? 'AI' : 'Signal Processing'} mode)`);
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

    this.analysisInterval = setInterval(analyzeAudio, 5000);
  }

  private async analyzeAudioFile(uri: string): Promise<void> {
    try {
      const analysisResult = await this.performVoiceAnalysis(uri);
      const stressLevel = this.calculateStressLevel(analysisResult);
      
      console.log('📊 Voice Analysis:', {
        volume: analysisResult.volume.toFixed(1),
        pitch: analysisResult.pitch.toFixed(1) + ' Hz',
        speechRate: analysisResult.speechRate.toFixed(1) + ' wps',
        stressLevel: stressLevel.level,
        confidence: (stressLevel.confidence * 100).toFixed(0) + '%',
        mode: this.modelLoaded ? 'AI' : 'Signal',
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
      const audioData = await this.readAudioFile(uri);
      
      if (!audioData || audioData.length === 0) {
        throw new Error('No audio data available');
      }

      // Basic signal processing metrics
      const rms = this.calculateRMS(audioData);
      const zcr = this.calculateZeroCrossingRate(audioData);
      const pitch = this.estimatePitch(audioData, 44100);
      const spectralCentroid = this.calculateSpectralCentroid(audioData);
      const energyVariance = this.calculateEnergyVariance(audioData);
      
      const volume = Math.min(100, rms * 100);
      
      // Silence detection
      const SILENCE_THRESHOLD = 3; // Lower threshold - more sensitive
      if (volume < SILENCE_THRESHOLD) {
        console.log('🔇 Silence detected');
        return this.getBaselineAnalysis();
      }
      
      // Voice activity detection - more lenient
      const hasVoiceActivity = this.detectVoiceActivity(rms, zcr, spectralCentroid);
      if (!hasVoiceActivity) {
        console.log('🔇 No voice activity detected');
        return this.getBaselineAnalysis();
      }
      
      const speechRate = this.estimateSpeechRate(zcr, energyVariance);
      
      // Try AI model inference if available
      let aiPrediction;
      if (this.modelLoaded && this.model) {
        aiPrediction = await this.runAIInference(audioData);
      }
      
      const stressIndicators = {
        shouting: volume > 70, // Must be actually loud
        rapidSpeech: speechRate > 5.0, // Must be actually fast
        highPitch: pitch > 280, // Raised threshold - 280+ Hz is stressed speech
        irregularPattern: energyVariance > 0.45, // Must be very irregular
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
        aiPrediction,
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      return this.getBaselineAnalysis();
    }
  }

  private async runAIInference(audioData: number[]): Promise<{ emotions: number[]; modelConfidence: number }> {
    try {
      if (!this.model) {
        throw new Error('Model not loaded');
      }

      // Dynamically load ONNX Tensor
      const { Tensor } = await import('onnxruntime-react-native');

      // Extract MFCC features (13 coefficients, standard for speech)
      const mfccFeatures = this.extractMFCC(audioData, 44100);
      
      // Flatten MFCC features for model input
      const flatFeatures = mfccFeatures.flat();
      const inputTensor = new Tensor('float32', new Float32Array(flatFeatures), [1, flatFeatures.length]);
      
      // Run inference
      const feeds = { input: inputTensor };
      const results = await this.model.run(feeds);
      
      // Get output (assumes model outputs emotion probabilities)
      const outputTensor = results.output;
      const emotions = Array.from(outputTensor.data as Float32Array);
      const modelConfidence = Math.max(...emotions);
      
      console.log('🤖 AI Prediction:', {
        calm: (emotions[0] * 100).toFixed(1) + '%',
        stressed: (emotions[1] * 100).toFixed(1) + '%',
        angry: (emotions[2] * 100).toFixed(1) + '%',
        fearful: (emotions[3] * 100).toFixed(1) + '%',
      });
      
      return { emotions, modelConfidence };
    } catch (error) {
      console.error('AI inference error:', error);
      return { emotions: [1, 0, 0, 0, 0], modelConfidence: 0 };
    }
  }

  private extractMFCC(audioData: number[], sampleRate: number): number[][] {
    try {
      // Simplified MFCC-like feature extraction using FFT
      // This is a basic implementation - for production, use a proper MFCC library
      
      const nMfcc = 13; // Number of coefficients
      const hopLength = 512;
      const fftSize = 2048;
      
      const mfccFeatures: number[][] = [];
      
      // Process audio in frames
      for (let i = 0; i < audioData.length - fftSize; i += hopLength) {
        const frame = audioData.slice(i, i + fftSize);
        
        // Apply Hamming window
        const windowedFrame = this.applyHammingWindow(frame);
        
        // Compute FFT
        const phasors = FFT.fft(windowedFrame);
        const magnitudes = FFT.util.fftMag(phasors);
        
        // Convert to mel scale and take DCT for MFCC-like features
        const melEnergies = this.computeMelEnergies(magnitudes, sampleRate);
        const mfccCoeffs = this.computeDCT(melEnergies, nMfcc);
        
        mfccFeatures.push(mfccCoeffs);
      }
      
      return mfccFeatures.length > 0 ? mfccFeatures : this.getDefaultMFCC();
    } catch (error) {
      console.error('MFCC extraction error:', error);
      return this.getDefaultMFCC();
    }
  }

  private applyHammingWindow(frame: number[]): number[] {
    const N = frame.length;
    return frame.map((sample, n) => {
      const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
      return sample * window;
    });
  }

  private computeMelEnergies(magnitudes: number[], sampleRate: number): number[] {
    // Simplified mel filterbank (normally would use 40 filters)
    const numFilters = 26;
    const melEnergies: number[] = [];
    
    const melMin = this.hzToMel(0);
    const melMax = this.hzToMel(sampleRate / 2);
    const melStep = (melMax - melMin) / (numFilters + 1);
    
    for (let i = 0; i < numFilters; i++) {
      const melCenter = melMin + (i + 1) * melStep;
      const hzCenter = this.melToHz(melCenter);
      const binCenter = Math.floor((hzCenter * magnitudes.length) / (sampleRate / 2));
      
      // Simple triangular filter
      let energy = 0;
      const width = 10; // Filter width in bins
      for (let j = Math.max(0, binCenter - width); j < Math.min(magnitudes.length, binCenter + width); j++) {
        energy += magnitudes[j];
      }
      melEnergies.push(Math.log(energy + 1e-10)); // Log energy
    }
    
    return melEnergies;
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  private computeDCT(melEnergies: number[], numCoeffs: number): number[] {
    // Discrete Cosine Transform
    const N = melEnergies.length;
    const dctCoeffs: number[] = [];
    
    for (let k = 0; k < numCoeffs; k++) {
      let sum = 0;
      for (let n = 0; n < N; n++) {
        sum += melEnergies[n] * Math.cos((Math.PI * k * (n + 0.5)) / N);
      }
      dctCoeffs.push(sum);
    }
    
    return dctCoeffs;
  }

  private getDefaultMFCC(): number[][] {
    // Return default MFCC features (13 coefficients × 100 frames)
    return Array(100).fill(0).map(() => Array(13).fill(0));
  }

  private detectVoiceActivity(rms: number, zcr: number, spectralCentroid: number): boolean {
    // More lenient voice activity detection
    const hasEnergy = rms > 0.03; // Lower threshold
    const zcrInVoiceRange = zcr > 0.01 && zcr < 0.30; // Wider range
    const inSpeechFrequencyRange = spectralCentroid > 200 && spectralCentroid < 5000; // Wider range
    
    const criteriaCount = [hasEnergy, zcrInVoiceRange, inSpeechFrequencyRange].filter(Boolean).length;
    return criteriaCount >= 2;
  }

  private async readAudioFile(uri: string): Promise<number[]> {
    try {
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioData = this.parseWAVFile(bytes);
      return audioData;
    } catch (error) {
      console.error('Error reading audio file:', error);
      return [];
    }
  }

  private parseWAVFile(bytes: Uint8Array): number[] {
    try {
      const dataOffset = 44;
      const audioData: number[] = [];
      
      for (let i = dataOffset; i < bytes.length - 1; i += 2) {
        const sample = bytes[i] | (bytes[i + 1] << 8);
        const signedSample = sample > 32767 ? sample - 65536 : sample;
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
      const minPeriod = Math.floor(sampleRate / 500);
      const maxPeriod = Math.floor(sampleRate / 50);
      
      let bestCorrelation = -1;
      let bestPeriod = minPeriod;
      
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
      
      // Only trust pitch if correlation is strong (> 0.3)
      // This filters out noise and weak signals
      if (bestCorrelation < 0.3) {
        return 150; // Return neutral pitch for unreliable detection
      }
      
      const pitch = sampleRate / bestPeriod;
      
      // Typical human speech: 85-255 Hz (male), 165-255 Hz (female)
      // Stressed speech: 250-400 Hz
      // Return 150 Hz (neutral) if outside reasonable voice range
      return pitch >= 80 && pitch <= 500 ? pitch : 150;
    } catch (error) {
      return 150;
    }
  }

  private calculateSpectralCentroid(samples: number[]): number {
    try {
      // Simplified spectral centroid without FFT dependency
      // Use zero-crossing rate as proxy
      const zcr = this.calculateZeroCrossingRate(samples);
      return zcr * 10000; // Scale to frequency-like range
    } catch (error) {
      return 1000;
    }
  }

  private calculateEnergyVariance(samples: number[]): number {
    if (samples.length === 0) return 0;
    
    const frameSize = 1024;
    const energies: number[] = [];
    
    for (let i = 0; i < samples.length - frameSize; i += frameSize) {
      const frame = samples.slice(i, i + frameSize);
      const energy = frame.reduce((sum, sample) => sum + sample * sample, 0) / frameSize;
      energies.push(energy);
    }
    
    if (energies.length < 2) return 0;
    
    const mean = energies.reduce((sum, e) => sum + e, 0) / energies.length;
    const variance = energies.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) / energies.length;
    
    return Math.sqrt(variance);
  }

  private estimateSpeechRate(zcr: number, energyVariance: number): number {
    const normalizedZCR = Math.max(0, Math.min(1, (zcr - 0.03) / 0.12));
    const normalizedVariance = Math.max(0, Math.min(1, (energyVariance - 0.05) / 0.25));
    
    const baseRate = 2.0;
    const zcrContribution = normalizedZCR * 2.0;
    const varianceContribution = normalizedVariance * 1.5;
    
    const speechRate = baseRate + zcrContribution + varianceContribution;
    return Math.max(1, Math.min(6, speechRate));
  }

  private getBaselineAnalysis(): VoiceAnalysisResult {
    return {
      volume: 2,
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
    const { volume, pitch, speechRate, stressIndicators, aiPrediction } = analysis;
    
    // If AI model is available, use it for primary detection
    if (aiPrediction && aiPrediction.modelConfidence > 0.5) {
      return this.calculateStressFromAI(aiPrediction, volume, pitch, speechRate);
    }
    
    // Otherwise use signal processing
    const indicators: string[] = [];
    let stressScore = 0;

    if (stressIndicators.shouting) {
      indicators.push('Elevated voice volume detected');
      stressScore += 3;
    }

    if (stressIndicators.rapidSpeech) {
      indicators.push('Rapid speech pattern detected');
      stressScore += 2;
    }

    if (stressIndicators.highPitch) {
      indicators.push('Elevated pitch detected');
      stressScore += 2;
    }

    if (stressIndicators.irregularPattern) {
      indicators.push('Irregular speech pattern detected');
      stressScore += 1;
    }

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

  private calculateStressFromAI(
    aiPrediction: { emotions: number[]; modelConfidence: number },
    volume: number,
    pitch: number,
    speechRate: number
  ): StressLevel {
    const [calm, stressed, angry, fearful, sad] = aiPrediction.emotions;
    
    // Calculate overall stress from emotions
    const stressScore = (stressed * 3) + (angry * 3) + (fearful * 2) + (sad * 1);
    const indicators: string[] = [];
    
    if (stressed > 0.3) indicators.push('AI detected stressed voice patterns');
    if (angry > 0.3) indicators.push('AI detected anger in voice');
    if (fearful > 0.3) indicators.push('AI detected fear in voice');
    if (volume > 65) indicators.push('Elevated voice volume');
    if (speechRate > 4.5) indicators.push('Rapid speech detected');
    
    let level: StressLevel['level'] = 'calm';
    if (stressScore > 2.5) level = 'crisis';
    else if (stressScore > 1.5) level = 'high';
    else if (stressScore > 0.8) level = 'moderate';
    else if (stressScore > 0.3) level = 'mild';
    
    return {
      level,
      confidence: aiPrediction.modelConfidence,
      indicators,
      timestamp: Date.now(),
      emotions: {
        calm,
        stressed,
        angry,
        fearful,
        sad,
      },
    };
  }

  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  isUsingAI(): boolean {
    return this.modelLoaded;
  }
}

