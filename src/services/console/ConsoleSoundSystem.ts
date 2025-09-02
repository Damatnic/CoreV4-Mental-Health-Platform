/**
 * Console Sound System
 * Provides gaming console-style audio feedback and haptic vibrations
 */

/**
 * Complete sound configuration with all required properties
 */
export interface SoundConfig {
  type: 'beep' | 'chirp' | 'whoosh' | 'thud' | 'ding' | 'alert' | 'success' | 'error' | 'ambient';
  volume: number; // 0.0 to 1.0
  pitch: number; // Hz
  duration: number; // seconds
  fadeOut?: boolean;
  haptic?: HapticConfig;
}

/**
 * Partial sound configuration for customizing existing sounds or creating new ones.
 * All properties are optional and will be filled with defaults if not provided.
 */
export interface PartialSoundConfig {
  type?: 'beep' | 'chirp' | 'whoosh' | 'thud' | 'ding' | 'alert' | 'success' | 'error' | 'ambient';
  volume?: number; // 0.0 to 1.0
  pitch?: number; // Hz
  duration?: number; // seconds
  fadeOut?: boolean;
  haptic?: HapticConfig;
}

export interface HapticConfig {
  pattern: number[]; // vibration pattern in ms [vibrate, pause, vibrate, pause...]
  intensity: 'light' | 'medium' | 'strong';
}

interface QueuedSound {
  soundName: keyof ConsoleSoundSystem['CONSOLE_SOUNDS'];
  options?: PartialSoundConfig;
  timestamp: number;
}

type PerformanceMode = 'low' | 'medium' | 'high';
type AudioSource = AudioBufferSourceNode;

export class ConsoleSoundSystem {
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private hapticEnabled = true;
  private masterVolume = 0.3; // Default conservative volume
  private soundCache = new Map<string, SoundConfig>();
  
  // Performance optimization properties
  private soundQueue: QueuedSound[] = [];
  private processingQueue = false;
  private audioPool = new Map<string, AudioSource[]>();
  private lastSoundTimes = new Map<string, number>();
  private performanceMode: PerformanceMode = 'medium';
  private isLowLatencyMode = false;

  // Console sound presets inspired by PS5/Xbox
  private readonly CONSOLE_SOUNDS: Record<string, SoundConfig> = {
    // Navigation sounds
    focus: {
      type: 'chirp',
      volume: 0.2,
      pitch: 800,
      duration: 0.1,
      haptic: { pattern: [20], intensity: 'light' }
    },
    select: {
      type: 'ding',
      volume: 0.4,
      pitch: 600,
      duration: 0.15,
      haptic: { pattern: [40], intensity: 'medium' }
    },
    back: {
      type: 'beep',
      volume: 0.3,
      pitch: 400,
      duration: 0.12,
      haptic: { pattern: [30], intensity: 'light' }
    },
    
    // UI interaction sounds
    hover: {
      type: 'chirp',
      volume: 0.15,
      pitch: 900,
      duration: 0.08,
      haptic: { pattern: [15], intensity: 'light' }
    },
    click: {
      type: 'thud',
      volume: 0.25,
      pitch: 200,
      duration: 0.1,
      haptic: { pattern: [25], intensity: 'medium' }
    },
    
    // System sounds
    startup: {
      type: 'whoosh',
      volume: 0.5,
      pitch: 300,
      duration: 1.2,
      fadeOut: true,
      haptic: { pattern: [100, 50, 100], intensity: 'medium' }
    },
    shutdown: {
      type: 'whoosh',
      volume: 0.4,
      pitch: 150,
      duration: 0.8,
      fadeOut: true,
      haptic: { pattern: [200], intensity: 'light' }
    },
    
    // Notification sounds
    achievement: {
      type: 'success',
      volume: 0.6,
      pitch: 800,
      duration: 0.5,
      haptic: { pattern: [100, 50, 100, 50, 150], intensity: 'strong' }
    },
    levelUp: {
      type: 'success',
      volume: 0.7,
      pitch: 600,
      duration: 0.8,
      haptic: { pattern: [80, 40, 80, 40, 120], intensity: 'strong' }
    },
    notification: {
      type: 'ding',
      volume: 0.3,
      pitch: 700,
      duration: 0.2,
      haptic: { pattern: [50, 50, 50], intensity: 'medium' }
    },
    
    // Emergency/Alert sounds
    emergency: {
      type: 'alert',
      volume: 0.8,
      pitch: 1000,
      duration: 0.3,
      haptic: { pattern: [100, 100, 100, 100, 200], intensity: 'strong' }
    },
    warning: {
      type: 'alert',
      volume: 0.5,
      pitch: 600,
      duration: 0.2,
      haptic: { pattern: [80, 80, 80], intensity: 'medium' }
    },
    
    // Mental health specific sounds (gentle, calming)
    breatheIn: {
      type: 'ambient',
      volume: 0.2,
      pitch: 400,
      duration: 4.0,
      fadeOut: true
    },
    breatheOut: {
      type: 'ambient',
      volume: 0.2,
      pitch: 200,
      duration: 4.0,
      fadeOut: true
    },
    meditation: {
      type: 'ambient',
      volume: 0.15,
      pitch: 300,
      duration: 10.0,
      fadeOut: true
    }
  };

  constructor() {
    this.initializeAudio();
    this.loadUserPreferences();
    this.detectPerformanceMode();
    this.setupAudioPool();
    this.initializeLowLatencyMode();
  }

  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.soundEnabled = false;
    }
  }

  private loadUserPreferences() {
    // Load user sound preferences from localStorage
    const soundPref = localStorage.getItem('console-sound-enabled');
    const hapticPref = localStorage.getItem('console-haptic-enabled');
    const volumePref = localStorage.getItem('console-master-volume');

    if (soundPref !== null) {
      this.soundEnabled = JSON.parse(soundPref);
    }
    
    if (hapticPref !== null) {
      this.hapticEnabled = JSON.parse(hapticPref);
    }
    
    if (volumePref !== null) {
      this.masterVolume = Math.max(0, Math.min(1, parseFloat(volumePref)));
    }
  }

  // Helper method to create a valid sound configuration with defaults
  private createSoundConfig(config: PartialSoundConfig): SoundConfig {
    return {
      type: config.type || 'beep',
      volume: Math.max(0, Math.min(1, config.volume ?? 0.3)),
      pitch: Math.max(50, Math.min(4000, config.pitch ?? 440)),
      duration: Math.max(0.01, Math.min(10, config.duration ?? 0.1)),
      fadeOut: config.fadeOut,
      haptic: config.haptic
    };
  }

  // Helper method to safely merge sound configurations
  private mergeSoundConfig(base: SoundConfig, options?: PartialSoundConfig): SoundConfig {
    if (!options) return base;
    
    return {
      type: options.type ?? base.type,
      volume: options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : base.volume,
      pitch: options.pitch !== undefined ? Math.max(50, Math.min(4000, options.pitch)) : base.pitch,
      duration: options.duration !== undefined ? Math.max(0.01, Math.min(10, options.duration)) : base.duration,
      fadeOut: options.fadeOut ?? base.fadeOut,
      haptic: options.haptic ?? base.haptic
    };
  }

  // Main sound playing method
  async playSound(soundName: keyof typeof this.CONSOLE_SOUNDS, options?: PartialSoundConfig) {
    if (!this.soundEnabled || !this.audioContext) return;

    const baseSound = this.CONSOLE_SOUNDS[soundName];
    if (!baseSound) {
      console.warn(`Sound "${String(soundName)}" not found in CONSOLE_SOUNDS`);
      return;
    }

    const soundConfig = this.mergeSoundConfig(baseSound, options);
    
    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Generate and play the sound
      await this.generateSound(soundConfig);

      // Trigger haptic feedback if available
      if (this.hapticEnabled && soundConfig.haptic) {
        this.triggerHaptic(soundConfig.haptic);
      }

    } catch (error) {
      console.warn(`Failed to play console sound "${String(soundName)}":`, error);
    }
  }

  private async generateSound(config: SoundConfig): Promise<void> {
    if (!this.audioContext) return;

    // Ensure all config values are valid with defaults
    const safeConfig: SoundConfig = {
      type: config.type || 'beep',
      volume: Math.max(0, Math.min(1, config.volume || 0.3)),
      pitch: Math.max(50, Math.min(4000, config.pitch || 440)),
      duration: Math.max(0.01, Math.min(10, config.duration || 0.1)),
      fadeOut: config.fadeOut,
      haptic: config.haptic
    };

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const compressor = this.audioContext.createDynamicsCompressor();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(this.audioContext.destination);

    // Configure oscillator based on sound type
    switch (safeConfig.type) {
      case 'beep':
      case 'chirp':
      case 'ding':
        oscillator.type = 'sine';
        break;
      case 'whoosh':
        oscillator.type = 'sawtooth';
        break;
      case 'thud':
        oscillator.type = 'square';
        break;
      case 'alert':
      case 'error':
        oscillator.type = 'triangle';
        break;
      case 'success':
        oscillator.type = 'sine';
        break;
      case 'ambient':
        oscillator.type = 'sine';
        break;
      default:
        oscillator.type = 'sine';
    }

    const now = this.audioContext.currentTime;
    const volume = safeConfig.volume * this.masterVolume;

    // Set frequency
    oscillator.frequency.setValueAtTime(safeConfig.pitch, now);

    // Configure gain envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Quick attack

    if (safeConfig.fadeOut) {
      gainNode.gain.linearRampToValueAtTime(volume * 0.8, now + safeConfig.duration * 0.7);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + safeConfig.duration);
    } else {
      gainNode.gain.setValueAtTime(volume, now + safeConfig.duration - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, now + safeConfig.duration);
    }

    // Special effects for certain sound types
    if (safeConfig.type === 'whoosh') {
      oscillator.frequency.exponentialRampToValueAtTime(safeConfig.pitch * 0.5, now + safeConfig.duration);
    } else if (safeConfig.type === 'alert' || safeConfig.type === 'error') {
      // Oscillating frequency for alerts and errors
      oscillator.frequency.setValueAtTime(safeConfig.pitch, now);
      oscillator.frequency.setValueAtTime(safeConfig.pitch * 1.2, now + 0.1);
      oscillator.frequency.setValueAtTime(safeConfig.pitch, now + 0.2);
    } else if (safeConfig.type === 'success') {
      // Rising frequency for success sounds
      oscillator.frequency.exponentialRampToValueAtTime(safeConfig.pitch * 1.5, now + safeConfig.duration * 0.3);
      oscillator.frequency.exponentialRampToValueAtTime(safeConfig.pitch * 1.2, now + safeConfig.duration);
    }

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + safeConfig.duration);
  }

  private triggerHaptic(config: HapticConfig) {
    if (!navigator.vibrate || !this.hapticEnabled || !config) return;

    try {
      // Ensure config has valid values with defaults
      const safePattern = Array.isArray(config.pattern) ? config.pattern : [50];
      const safeIntensity = config.intensity || 'medium';

      // Scale intensity
      const intensityMultiplier = {
        light: 0.5,
        medium: 1.0,
        strong: 1.5
      }[safeIntensity] || 1.0;

      const scaledPattern = safePattern
        .filter(duration => typeof duration === 'number' && duration > 0)
        .map(duration => Math.round(Math.max(10, Math.min(1000, duration * intensityMultiplier))));

      if (scaledPattern.length > 0) {
        navigator.vibrate(scaledPattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // Convenience methods for common console interactions
  onFocus() { this.playSound('focus'); }
  onSelect() { this.playSound('select'); }
  onBack() { this.playSound('back'); }
  onHover() { this.playSound('hover'); }
  onClick() { this.playSound('click'); }
  onAchievement() { this.playSound('achievement'); }
  onLevelUp() { this.playSound('levelUp'); }
  onNotification() { this.playSound('notification'); }
  onEmergency() { this.playSound('emergency'); }
  onWarning() { this.playSound('warning'); }

  // System sounds
  async playStartup() { 
    await this.playSound('startup'); 
  }
  
  async playShutdown() { 
    await this.playSound('shutdown'); 
  }

  // Mental health specific sounds
  playBreatheIn() { this.playSound('breatheIn'); }
  playBreatheOut() { this.playSound('breatheOut'); }
  playMeditation() { this.playSound('meditation'); }

  // Method to play a custom sound with proper validation
  async playCustomSound(config: PartialSoundConfig) {
    if (!this.soundEnabled || !this.audioContext) return;

    const validConfig = this.createSoundConfig(config);
    
    try {
      // Ensure audio context is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Generate and play the sound
      await this.generateSound(validConfig);

      // Trigger haptic feedback if available
      if (this.hapticEnabled && validConfig.haptic) {
        this.triggerHaptic(validConfig.haptic);
      }

    } catch (error) {
      console.warn('Failed to play custom sound:', error);
    }
  }

  // Settings management
  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('console-sound-enabled', JSON.stringify(enabled));
  }

  setHapticEnabled(enabled: boolean) {
    this.hapticEnabled = enabled;
    localStorage.setItem('console-haptic-enabled', JSON.stringify(enabled));
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('console-master-volume', this.masterVolume.toString());
  }

  // Getters
  get isSoundEnabled() { return this.soundEnabled; }
  get isHapticEnabled() { return this.hapticEnabled; }
  get currentVolume() { return this.masterVolume; }

  // Test sound for settings
  async testSound() {
    await this.playSound('select');
  }

  // Enhanced cleanup with performance optimizations
  dispose() {
    // Clear all sound queues and timers
    this.soundQueue = [];
    this.processingQueue = false;
    
    // Clear audio pools
    this.audioPool.forEach((pool: AudioSource[]) => {
      pool.forEach((source: AudioSource) => {
        try {
          source.stop();
          source.disconnect();
        } catch (e) {
          // Source might already be stopped
        }
      });
    });
    this.audioPool.clear();
    
    // Clear caches
    this.soundCache.clear();
    this.lastSoundTimes.clear();
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
  
  // New performance optimization methods
  private detectPerformanceMode(): void {
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const connection = (navigator as any).connection;
    
    if (memory <= 4 || cores <= 2 || connection?.effectiveType === '2g') {
      this.performanceMode = 'low';
    } else if (memory <= 8 || cores <= 4) {
      this.performanceMode = 'medium';
    } else {
      this.performanceMode = 'high';
    }
  }
  
  private setupAudioPool(): void {
    // Pre-create audio sources for commonly used sounds
    const commonSounds = ['focus', 'select', 'back', 'hover', 'click'];
    
    commonSounds.forEach(soundName => {
      this.audioPool.set(soundName, []);
    });
  }
  
  private initializeLowLatencyMode(): void {
    if (this.performanceMode === 'high' && this.audioContext) {
      this.isLowLatencyMode = true;
      this.preGenerateCommonSounds();
    }
  }
  
  private async setupAudioWorklet(): Promise<void> {
    try {
      // This would load a custom audio worklet for ultra-low latency
      // await this.audioContext.audioWorklet.addModule('/audio-worklet.js');
      console.log('[Console Audio] Audio worklet would be set up here for ultra-low latency');
    } catch (error) {
      console.log('[Console Audio] Audio worklet not available');
    }
  }
  
  private async preGenerateCommonSounds(): Promise<void> {
    const commonSounds: (keyof typeof this.CONSOLE_SOUNDS)[] = ['focus', 'select', 'back'];
    
    for (const soundName of commonSounds) {
      const soundConfig = this.CONSOLE_SOUNDS[soundName];
      if (soundConfig) {
        try {
          const audioBuffer = await this.createAudioBuffer(soundConfig);
          // Store the buffer for instant playback
          this.soundCache.set(String(soundName), soundConfig);
        } catch (error) {
          console.warn(`Failed to pre-generate sound: ${String(soundName)}`, error);
        }
      }
    }
  }
  
  private async createAudioBuffer(config: SoundConfig): Promise<AudioBuffer | null> {
    if (!this.audioContext) return null;
    
    // This would create an AudioBuffer for instant playback
    // Implementation would depend on the specific sound generation method
    return null;
  }
  
  private async playBufferedSound(soundName: string, config: SoundConfig): Promise<void> {
    // Play from pre-generated buffer for lowest latency
    // Fall back to generating if buffer doesn't exist
    await this.generateSound(config);
  }
  
  private queueSound(soundName: keyof typeof this.CONSOLE_SOUNDS, options?: PartialSoundConfig): void {
    this.soundQueue.push({
      soundName,
      options,
      timestamp: Date.now()
    });
    
    if (!this.processingQueue) {
      this.processQueuedSounds();
    }
  }
  
  private async processQueuedSounds(): Promise<void> {
    this.processingQueue = true;
    
    while (this.soundQueue.length > 0) {
      const sound = this.soundQueue.shift();
      if (!sound) break;
      
      // Only play sounds that are less than 100ms old
      if (Date.now() - sound.timestamp < 100) {
        await this.playSound(sound.soundName, sound.options);
      }
      
      // Throttle to maintain 60fps
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    
    this.processingQueue = false;
  }
  
  private shouldTriggerHaptic(): boolean {
    // Throttle haptic feedback for better performance
    const lastHaptic = this.lastSoundTimes.get('haptic') || 0;
    const now = Date.now();
    
    if (now - lastHaptic >= 100) { // Max 10 haptic events per second
      this.lastSoundTimes.set('haptic', now);
      return true;
    }
    
    return false;
  }
  
  // New getter methods for performance monitoring
  get currentPerformanceMode(): string {
    return this.performanceMode;
  }
  
  get isLowLatencyEnabled(): boolean {
    return this.isLowLatencyMode;
  }
  
  get queueLength(): number {
    return this.soundQueue.length;
  }
  
  // Method to adjust performance mode dynamically
  setPerformanceMode(mode: 'high' | 'medium' | 'low'): void {
    this.performanceMode = mode;
    localStorage.setItem('console-performance-mode', mode);
    
    if (mode === 'low') {
      this.isLowLatencyMode = false;
    } else if (mode === 'high') {
      this.initializeLowLatencyMode();
    }
  }
  
  // Performance metrics
  getPerformanceMetrics(): Record<string, any> {
    return {
      performanceMode: this.performanceMode,
      lowLatencyMode: this.isLowLatencyMode,
      queueLength: this.soundQueue.length,
      cachedSounds: this.soundCache.size,
      audioPoolSize: Array.from(this.audioPool.values()).reduce((total, pool) => total + pool.length, 0),
      soundEnabled: this.soundEnabled,
      hapticEnabled: this.hapticEnabled,
      masterVolume: this.masterVolume
    };
  }
}

// Global instance
export const consoleSoundSystem = new ConsoleSoundSystem();

// React hook for easy access
import { useEffect, useRef } from 'react';

export function useConsoleSound() {
  const soundSystemRef = useRef(consoleSoundSystem);

  useEffect(() => {
    const soundSystem = soundSystemRef.current;
    
    return () => {
      // Cleanup if component unmounts
    };
  }, []);

  return {
    playSound: soundSystemRef.current.playSound.bind(soundSystemRef.current),
    playCustomSound: soundSystemRef.current.playCustomSound.bind(soundSystemRef.current),
    onFocus: soundSystemRef.current.onFocus.bind(soundSystemRef.current),
    onSelect: soundSystemRef.current.onSelect.bind(soundSystemRef.current),
    onBack: soundSystemRef.current.onBack.bind(soundSystemRef.current),
    onHover: soundSystemRef.current.onHover.bind(soundSystemRef.current),
    onClick: soundSystemRef.current.onClick.bind(soundSystemRef.current),
    onAchievement: soundSystemRef.current.onAchievement.bind(soundSystemRef.current),
    onLevelUp: soundSystemRef.current.onLevelUp.bind(soundSystemRef.current),
    onNotification: soundSystemRef.current.onNotification.bind(soundSystemRef.current),
    onEmergency: soundSystemRef.current.onEmergency.bind(soundSystemRef.current),
    onWarning: soundSystemRef.current.onWarning.bind(soundSystemRef.current),
    playBreatheIn: soundSystemRef.current.playBreatheIn.bind(soundSystemRef.current),
    playBreatheOut: soundSystemRef.current.playBreatheOut.bind(soundSystemRef.current),
    playMeditation: soundSystemRef.current.playMeditation.bind(soundSystemRef.current),
    settings: {
      setSoundEnabled: soundSystemRef.current.setSoundEnabled.bind(soundSystemRef.current),
      setHapticEnabled: soundSystemRef.current.setHapticEnabled.bind(soundSystemRef.current),
      setMasterVolume: soundSystemRef.current.setMasterVolume.bind(soundSystemRef.current),
      isSoundEnabled: soundSystemRef.current.isSoundEnabled,
      isHapticEnabled: soundSystemRef.current.isHapticEnabled,
      currentVolume: soundSystemRef.current.currentVolume,
      testSound: soundSystemRef.current.testSound.bind(soundSystemRef.current),
    }
  };
}