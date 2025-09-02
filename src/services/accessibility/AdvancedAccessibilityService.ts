import { logger, LogCategory } from '../logging/logger';
import { secureStorage } from '../security/secureStorage';

export interface VoiceCommand {
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
  confidence: number;
  timestamp: number;
}

export interface EyeTrackingData {
  x: number;
  y: number;
  timestamp: number;
  fixation: boolean;
  elementId?: string;
}

export interface AccessibilityProfile {
  userId: string;
  preferences: {
    voiceNavigation: boolean;
    eyeTracking: boolean;
    motorAssistance: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    textToSpeech: boolean;
    speechToText: boolean;
    voiceCommandSensitivity: 'low' | 'medium' | 'high';
    eyeTrackingCalibration: EyeTrackingCalibration;
    customVoiceCommands: VoiceCommand[];
  };
  capabilities: {
    canSpeak: boolean;
    canHear: boolean;
    hasVoiceRecognition: boolean;
    hasEyeTracking: boolean;
    hasMotorImpairment: boolean;
  };
  lastUpdated: number;
}

export interface EyeTrackingCalibration {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
  bottomRight: { x: number; y: number };
  center: { x: number; y: number };
  isCalibrated: boolean;
  calibrationTimestamp: number;
}

export interface VoiceNavigationAction {
  command: string;
  description: string;
  aliases: string[];
  priority: 'crisis' | 'high' | 'medium' | 'low';
  execute: (parameters?: any) => Promise<void>;
}

export class AdvancedAccessibilityService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private eyeTracker: any = null;
  private isVoiceActive = false;
  private isEyeTrackingActive = false;
  private currentProfile: AccessibilityProfile | null = null;
  private voiceCommands: Map<string, VoiceNavigationAction> = new Map();
  private eyeTrackingCallbacks: Set<(data: EyeTrackingData) => void> = new Set();

  constructor() {
    this.initializeAccessibilityServices();
    this.setupVoiceCommands();
  }

  private async initializeAccessibilityServices(): Promise<void> {
    try {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.setupSpeechRecognition();
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }

      // Initialize Eye Tracking (using WebGazer.js in production)
      await this.initializeEyeTracking();

      // Load user profile
      await this.loadAccessibilityProfile();

      logger.info('Advanced accessibility services initialized');

    } catch (error) {
      logger.error('Failed to initialize accessibility services:', error as Error);
    }
  }

  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult && lastResult.isFinal) {
        const transcript = lastResult[0]?.transcript?.toLowerCase().trim() || '';
        const confidence = lastResult[0]?.confidence || 0;
        
        this.processVoiceCommand({
          phrase: transcript,
          action: '',
          confidence,
          timestamp: Date.now()
        });
      }
    };

    this.recognition.onerror = (event) => {
      logger.error('Speech recognition error:', new Error(event.error || 'Unknown speech recognition error'));
    };

    this.recognition.onend = () => {
      if (this.isVoiceActive && this.currentProfile?.preferences.voiceNavigation) {
        // Restart recognition if it should be active
        setTimeout(() => this.startVoiceNavigation(), 1000);
      }
    };
  }

  private async initializeEyeTracking(): Promise<void> {
    try {
      // In production, this would initialize WebGazer.js or similar eye tracking library
      // For now, simulate eye tracking capabilities
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Check if camera is available for eye tracking
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        // Mock eye tracking initialization
        this.eyeTracker = {
          isReady: true,
          calibration: null
        };
      }
    } catch (error) {
      logger.warn('Eye tracking not available', {
        category: LogCategory.ACCESSIBILITY,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      });
    }
  }

  private setupVoiceCommands(): void {
    const commands: VoiceNavigationAction[] = [
      {
        command: 'emergency help',
        description: 'Activate emergency crisis support',
        aliases: ['help me', 'crisis', 'emergency', 'need help'],
        priority: 'crisis',
        execute: async () => {
          await this.speak('Activating emergency crisis support. Connecting you to immediate help.');
          // Trigger emergency protocols
          window.dispatchEvent(new CustomEvent('activateEmergencyHelp'));
        }
      },
      {
        command: 'call 911',
        description: 'Initiate emergency call to 911',
        aliases: ['call nine one one', 'emergency call'],
        priority: 'crisis',
        execute: async () => {
          await this.speak('Calling 911 now.');
          window.location.href = 'tel:911';
        }
      },
      {
        command: 'navigate home',
        description: 'Navigate to home page',
        aliases: ['go home', 'home page', 'dashboard'],
        priority: 'high',
        execute: async () => {
          await this.speak('Navigating to home.');
          window.location.hash = '#/';
        }
      },
      {
        command: 'mood tracker',
        description: 'Open mood tracking interface',
        aliases: ['track mood', 'mood tracking', 'log mood'],
        priority: 'medium',
        execute: async () => {
          await this.speak('Opening mood tracker.');
          window.location.hash = '#/wellness/mood-tracker';
        }
      },
      {
        command: 'breathing exercise',
        description: 'Start guided breathing exercise',
        aliases: ['breathe', 'breathing', 'calm down'],
        priority: 'high',
        execute: async () => {
          await this.speak('Starting breathing exercise. Breathe in slowly.');
          window.dispatchEvent(new CustomEvent('startBreathingExercise'));
        }
      },
      {
        command: 'read aloud',
        description: 'Read current page content aloud',
        aliases: ['read page', 'speak text', 'read content'],
        priority: 'medium',
        execute: async () => {
          await this.readPageContent();
        }
      },
      {
        command: 'increase text size',
        description: 'Increase text size for better readability',
        aliases: ['bigger text', 'larger font', 'zoom in'],
        priority: 'medium',
        execute: async () => {
          this.adjustTextSize(1.2);
          await this.speak('Text size increased.');
        }
      },
      {
        command: 'decrease text size',
        description: 'Decrease text size',
        aliases: ['smaller text', 'smaller font', 'zoom out'],
        priority: 'medium',
        execute: async () => {
          this.adjustTextSize(0.8);
          await this.speak('Text size decreased.');
        }
      },
      {
        command: 'high contrast',
        description: 'Toggle high contrast mode',
        aliases: ['contrast mode', 'dark mode', 'accessibility mode'],
        priority: 'medium',
        execute: async () => {
          await this.toggleHighContrast();
          await this.speak('High contrast mode toggled.');
        }
      },
      {
        command: 'stop listening',
        description: 'Disable voice navigation',
        aliases: ['turn off voice', 'disable voice', 'stop voice'],
        priority: 'low',
        execute: async () => {
          await this.speak('Voice navigation disabled.');
          this.stopVoiceNavigation();
        }
      }
    ];

    // Register all commands
    commands.forEach(cmd => {
      this.voiceCommands.set(cmd.command, cmd);
      cmd.aliases.forEach(alias => {
        this.voiceCommands.set(alias, cmd);
      });
    });
  }

  public async startVoiceNavigation(): Promise<boolean> {
    try {
      if (!this.recognition) {
        throw new Error('Speech recognition not available');
      }

      this.isVoiceActive = true;
      this.recognition.start();
      
      await this.speak('Voice navigation activated. You can say commands like "emergency help", "navigate home", or "mood tracker".');
      
      logger.info('Voice navigation started');
      return true;

    } catch (error) {
      logger.error('Failed to start voice navigation:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  public stopVoiceNavigation(): void {
    if (this.recognition && this.isVoiceActive) {
      this.isVoiceActive = false;
      this.recognition.stop();
      logger.info('Voice navigation stopped');
    }
  }

  public async startEyeTracking(): Promise<boolean> {
    try {
      if (!this.eyeTracker || !this.eyeTracker.isReady) {
        throw new Error('Eye tracking not available');
      }

      this.isEyeTrackingActive = true;
      
      // Start eye tracking simulation
      this.simulateEyeTracking();
      
      logger.info('Eye tracking started');
      return true;

    } catch (error) {
      logger.error('Failed to start eye tracking:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  public stopEyeTracking(): void {
    this.isEyeTrackingActive = false;
    logger.info('Eye tracking stopped');
  }

  private simulateEyeTracking(): void {
    if (!this.isEyeTrackingActive) return;

    // Simulate eye tracking data
    const mockEyeData: EyeTrackingData = {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      timestamp: Date.now(),
      fixation: Math.random() > 0.7,
      elementId: this.getElementAtPosition(Math.random() * window.innerWidth, Math.random() * window.innerHeight)
    };

    // Notify callbacks
    this.eyeTrackingCallbacks.forEach(callback => {
      callback(mockEyeData);
    });

    // Continue simulation
    setTimeout(() => this.simulateEyeTracking(), 100);
  }

  private getElementAtPosition(x: number, y: number): string | undefined {
    const element = document.elementFromPoint(x, y);
    return element?.id || element?.className || undefined;
  }

  public onEyeTracking(callback: (data: EyeTrackingData) => void): () => void {
    this.eyeTrackingCallbacks.add(callback);
    return () => this.eyeTrackingCallbacks.delete(callback);
  }

  private async processVoiceCommand(command: VoiceCommand): Promise<void> {
    try {
      const action = this.findMatchingCommand(command.phrase);
      
      if (action) {
        logger.info(`Executing voice command: ${command.phrase}`);
        command.action = action.command;
        
        // Execute the command
        await action.execute();
        
        // Log command usage
        await this.logCommandUsage(command);
        
      } else {
        await this.speak('Command not recognized. Try saying "emergency help", "navigate home", or "mood tracker".');
      }

    } catch (error) {
      logger.error('Failed to process voice command:', error instanceof Error ? error : new Error(String(error)));
      await this.speak('Sorry, I couldn\'t process that command. Please try again.');
    }
  }

  private findMatchingCommand(phrase: string): VoiceNavigationAction | null {
    const normalizedPhrase = phrase.toLowerCase().trim();
    
    // Direct match first
    if (this.voiceCommands.has(normalizedPhrase)) {
      return this.voiceCommands.get(normalizedPhrase)!;
    }

    // Fuzzy matching - look for commands that contain key words
    for (const [key, action] of this.voiceCommands.entries()) {
      const keywords = key.split(' ');
      const phraseWords = normalizedPhrase.split(' ');
      
      const matches = keywords.filter(keyword => 
        phraseWords.some(word => word.includes(keyword) || keyword.includes(word))
      );

      // If more than 50% of keywords match, consider it a match
      if (matches.length / keywords.length > 0.5) {
        return action;
      }
    }

    return null;
  }

  public async speak(text: string, priority: 'low' | 'normal' | 'high' | 'emergency' = 'normal'): Promise<void> {
    try {
      if (!this.synthesis) {
        throw new Error('Speech synthesis not available');
      }

      // Cancel any ongoing speech for high priority messages
      if (priority === 'emergency' || priority === 'high') {
        this.synthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings based on priority
      switch (priority) {
        case 'emergency':
          utterance.rate = 1.2;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;
          break;
        case 'high':
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 0.9;
          break;
        default:
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 0.8;
          break;
      }

      // Choose appropriate voice
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      return new Promise((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = (error) => reject(error);
        this.synthesis!.speak(utterance);
      });

    } catch (error) {
      logger.error('Failed to speak text:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async readPageContent(): Promise<void> {
    try {
      const mainContent = document.querySelector('main') || document.body;
      const textContent = this.extractReadableText(mainContent);
      
      if (textContent.length > 0) {
        await this.speak(`Reading page content: ${textContent.substring(0, 500)}...`);
      } else {
        await this.speak('No readable content found on this page.');
      }

    } catch (error) {
      logger.error('Failed to read page content:', error instanceof Error ? error : new Error(String(error)));
      await this.speak('Sorry, I couldn\'t read the page content.');
    }
  }

  private extractReadableText(element: Element): string {
    const ignoredTags = ['script', 'style', 'nav', 'footer', 'aside'];
    const textParts: string[] = [];

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (parent && ignoredTags.includes(parent.tagName.toLowerCase())) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text && text.length > 2) {
        textParts.push(text);
      }
    }

    return textParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private adjustTextSize(factor: number): void {
    const currentSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const newSize = Math.max(12, Math.min(24, currentSize * factor));
    document.documentElement.style.fontSize = `${newSize}px`;
  }

  private async toggleHighContrast(): Promise<void> {
    const body = document.body;
    const hasHighContrast = body.classList.contains('high-contrast');
    
    if (hasHighContrast) {
      body.classList.remove('high-contrast');
    } else {
      body.classList.add('high-contrast');
    }

    // Update user preferences
    if (this.currentProfile) {
      this.currentProfile.preferences.highContrast = !hasHighContrast;
      await this.saveAccessibilityProfile();
    }
  }

  private async logCommandUsage(command: VoiceCommand): Promise<void> {
    try {
      const usage = {
        command: command.phrase,
        action: command.action,
        confidence: command.confidence,
        timestamp: command.timestamp
      };

      // Store usage data for analytics (privacy-preserving)
      const usageLog = await secureStorage.getItem('voice_command_usage') || [];
      usageLog.push(usage);
      
      // Keep only last 100 commands
      const recentUsage = usageLog.slice(-100);
      await secureStorage.setItem('voice_command_usage', recentUsage);

    } catch (error) {
      logger.error('Failed to log command usage:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async loadAccessibilityProfile(): Promise<AccessibilityProfile> {
    try {
      const profile = await secureStorage.getItem('accessibility_profile');
      
      if (profile) {
        this.currentProfile = profile;
        await this.applyAccessibilitySettings(profile);
        return profile;
      } else {
        // Create default profile
        const defaultProfile: AccessibilityProfile = {
          userId: 'anonymous',
          preferences: {
            voiceNavigation: false,
            eyeTracking: false,
            motorAssistance: false,
            highContrast: false,
            reducedMotion: false,
            textToSpeech: false,
            speechToText: false,
            voiceCommandSensitivity: 'medium',
            eyeTrackingCalibration: {
              topLeft: { x: 0, y: 0 },
              topRight: { x: 0, y: 0 },
              bottomLeft: { x: 0, y: 0 },
              bottomRight: { x: 0, y: 0 },
              center: { x: 0, y: 0 },
              isCalibrated: false,
              calibrationTimestamp: 0
            },
            customVoiceCommands: []
          },
          capabilities: {
            canSpeak: !!this.synthesis,
            canHear: !!this.recognition,
            hasVoiceRecognition: !!this.recognition,
            hasEyeTracking: !!this.eyeTracker,
            hasMotorImpairment: false
          },
          lastUpdated: Date.now()
        };

        this.currentProfile = defaultProfile;
        await this.saveAccessibilityProfile();
        return defaultProfile;
      }

    } catch (error) {
      logger.error('Failed to load accessibility profile:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async saveAccessibilityProfile(): Promise<void> {
    if (!this.currentProfile) return;

    try {
      this.currentProfile.lastUpdated = Date.now();
      await secureStorage.setItem('accessibility_profile', this.currentProfile);
      logger.info('Accessibility profile saved');

    } catch (error) {
      logger.error('Failed to save accessibility profile:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async applyAccessibilitySettings(profile: AccessibilityProfile): Promise<void> {
    try {
      // Apply high contrast if enabled
      if (profile.preferences.highContrast) {
        document.body.classList.add('high-contrast');
      }

      // Apply reduced motion if enabled
      if (profile.preferences.reducedMotion) {
        document.body.classList.add('reduce-motion');
      }

      // Start voice navigation if enabled
      if (profile.preferences.voiceNavigation) {
        await this.startVoiceNavigation();
      }

      // Start eye tracking if enabled
      if (profile.preferences.eyeTracking && profile.preferences.eyeTrackingCalibration.isCalibrated) {
        await this.startEyeTracking();
      }

    } catch (error) {
      logger.error('Failed to apply accessibility settings:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async updateProfile(updates: Partial<AccessibilityProfile['preferences']>): Promise<void> {
    if (!this.currentProfile) {
      await this.loadAccessibilityProfile();
    }

    if (this.currentProfile) {
      this.currentProfile.preferences = { ...this.currentProfile.preferences, ...updates };
      await this.saveAccessibilityProfile();
      await this.applyAccessibilitySettings(this.currentProfile);
    }
  }

  public getProfile(): AccessibilityProfile | null {
    return this.currentProfile;
  }

  public getAvailableCommands(): VoiceNavigationAction[] {
    return Array.from(new Set(this.voiceCommands.values()));
  }

  public isVoiceNavigationActive(): boolean {
    return this.isVoiceActive;
  }

  public isEyeTrackingEnabled(): boolean {
    return this.isEyeTrackingActive;
  }
}

export const advancedAccessibilityService = new AdvancedAccessibilityService();