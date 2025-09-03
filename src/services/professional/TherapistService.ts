// Professional Support System Integration Service
// Manages therapist onboarding, verification, appointments, and video sessions

import { apiService } from '../api/ApiService';
import { wsService } from '../websocket/WebSocketService';
import { logger } from '../logging/logger';
import {
  Therapist,
  Appointment,
  User,
  TherapistCredentials,
  PaymentInfo,
  _ApiResponse
} from '../api/types';

// Video calling providers
export enum VideoProvider {
  AGORA = 'agora',
  TWILIO = 'twilio',
  ZOOM = 'zoom',
  CUSTOM = 'custom'
}

// Payment providers
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square'
}

// Therapist verification status
export enum VerificationStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

// Video session configuration
interface VideoConfig {
  provider: VideoProvider;
  apiKey?: string;
  apiSecret?: string;
  roomId?: string;
  token?: string;
  settings: VideoSettings;
}

interface VideoSettings {
  resolution: '720p' | '1080p' | '480p';
  frameRate: 15 | 24 | 30;
  audioBitrate: number;
  videoBitrate: number;
  screenShare: boolean;
  recording: boolean;
  virtualBackground: boolean;
}

// Payment configuration
interface PaymentConfig {
  provider: PaymentProvider;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
  currency: string;
  testMode: boolean;
}

// Therapist onboarding data
interface TherapistOnboarding {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
  };
  credentials: TherapistCredentials;
  practiceInfo: {
    practiceName?: string;
    practiceAddress?: string;
    website?: string;
    specializations: string[];
    treatmentApproaches: string[];
    languages: string[];
  };
  insurance: {
    acceptsInsurance: boolean;
    providers: string[];
    npiNumber?: string;
  };
  availability: {
    timezone: string;
    regularHours: unknown;
    sessionDuration: number;
    bufferTime: number;
  };
  rates: {
    individualSession: number;
    coupleSession?: number;
    groupSession?: number;
    slidingScale: boolean;
    slidingScaleMin?: number;
    slidingScaleMax?: number;
  };
  documents: {
    license: File | string;
    insurance: File | string;
    resume?: File | string;
    certifications?: (File | string)[];
  };
  agreements: {
    termsAccepted: boolean;
    hipaaCompliance: boolean;
    backgroundCheck: boolean;
    liabilityInsurance: boolean;
  };
}

// Appointment booking data
interface BookingRequest {
  _therapistId: string;
  patientId: string;
  date: Date;
  time: string;
  duration: number;
  type: 'initial' | 'followup' | 'crisis';
  format: 'video' | 'phone' | 'in-person';
  reason?: string;
  insurance?: {
    provider: string;
    memberId: string;
    groupNumber: string;
  };
  paymentMethod: 'insurance' | 'self-pay' | 'sliding-scale';
}

// Video session state
interface VideoSession {
  sessionId: string;
  appointmentId: string;
  roomId: string;
  participants: string[];
  startTime?: Date;
  endTime?: Date;
  duration: number;
  recording?: string;
  _status: 'waiting' | 'active' | 'ended';
}

// Professional Support Service Class
export class TherapistService {
  private static instance: TherapistService;
  private videoConfig: VideoConfig | null = null;
  private paymentConfig: PaymentConfig | null = null;
  private activeVideoSession: VideoSession | null = null;
  private verificationCache: Map<string, VerificationStatus> = new Map();

  private constructor() {
    this.initializeConfigurations();
    this.setupWebSocketHandlers();
  }

  // Singleton pattern
  public static getInstance(): TherapistService {
    if (!TherapistService.instance) {
      TherapistService.instance = new TherapistService();
    }
    return TherapistService.instance;
  }

  // Initialize service configurations
  private initializeConfigurations(): void {
    // Load video provider configuration
    this.videoConfig = {
      provider: (import.meta.env.VITE_VIDEO_PROVIDER as VideoProvider) || VideoProvider.AGORA,
      apiKey: import.meta.env.VITE_VIDEO_API_KEY,
      apiSecret: import.meta.env.VITE_VIDEO_API_SECRET,
      settings: {
        resolution: '720p',
        frameRate: 30,
        audioBitrate: 48000,
        videoBitrate: 1000000,
        screenShare: true,
        recording: true,
        virtualBackground: true
      }
    };

    // Load payment provider configuration
    this.paymentConfig = {
      provider: (import.meta.env.VITE_PAYMENT_PROVIDER as PaymentProvider) || PaymentProvider.STRIPE,
      apiKey: import.meta.env.VITE_PAYMENT_API_KEY || '',
      apiSecret: import.meta.env.VITE_PAYMENT_API_SECRET,
      webhookSecret: import.meta.env.VITE_PAYMENT_WEBHOOK_SECRET,
      currency: 'USD',
      testMode: import.meta.env.MODE !== 'production'
    };
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    // Listen for therapist availability updates
    wsService.on('therapist:available', (data: unknown) => {
      this.handleTherapistAvailability(data);
    });

    // Listen for appointment updates
    wsService.on('appointment:update', (data: unknown) => {
      this.handleAppointmentUpdate(data);
    });

    // Listen for video session events
    wsService.on('video:session:start', (data: unknown) => {
      this.handleVideoSessionStart(data);
    });

    wsService.on('video:session:end', (data: unknown) => {
      this.handleVideoSessionEnd(data);
    });
  }

  // ============================================
  // Therapist Onboarding & Verification
  // ============================================

  public async startOnboarding(data: TherapistOnboarding): Promise<{
    _therapistId: string;
    verificationStatus: VerificationStatus;
    nextSteps: string[];
  }> {
    try {
      // Step 1: Create therapist account
      const therapist = await this.createTherapistAccount(data);
      
      // Step 2: Upload documents
      const __documentsUploaded = await this.uploadVerificationDocuments(
        therapist.id,
        data.documents
      );
      
      // Step 3: Initiate verification process
      const verificationStatus = await this.initiateVerification(therapist.id);
      
      // Step 4: Schedule onboarding call if needed
      const nextSteps = this.determineNextSteps(_verificationStatus);
      
      return {
        _therapistId: therapist.id,
        verificationStatus,
        nextSteps
      };
    } catch {
      logger.error('Onboarding failed:');
      throw undefined;
    }
  }

  private async createTherapistAccount(data: TherapistOnboarding): Promise<Therapist> {
    // Create user account with therapist role
    const userResponse = await apiService.register({
      email: data.personalInfo.email,
      password: '', // Temporary, will be set by therapist
      username: `dr_${data.personalInfo.lastName.toLowerCase()}`,
      role: 'therapist',
      acceptedTerms: data.agreements.termsAccepted,
      marketingConsent: false
    });

    // Create therapist profile
    const therapist: Partial<Therapist> = {
      userId: userResponse.id,
      credentials: data.credentials,
      specializations: data.practiceInfo.specializations,
      availability: {
        timezone: data.availability.timezone,
        regularHours: data.availability.regularHours,
        exceptions: []
      },
      acceptingNewClients: true,
      languages: data.practiceInfo.languages,
      insuranceAccepted: data.insurance.providers,
      sessionRate: data.rates.individualSession,
      slidingScale: data.rates.slidingScale,
      verified: false,
      clients: [],
      ratings: []
    };

    // Save to backend
    // In production, this would be an API call
    return therapist as Therapist;
  }

  private async uploadVerificationDocuments(
    _therapistId: string,
    documents: TherapistOnboarding['documents']
  ): Promise<boolean> {
    try {
      const uploads = [];

      // Upload license
      if (documents.license instanceof File) {
        uploads.push(apiService.uploadFile(documents.license, 'document'));
      }

      // Upload insurance
      if (documents.insurance instanceof File) {
        uploads.push(apiService.uploadFile(documents.insurance, 'document'));
      }

      // Upload resume if provided
      if (documents.resume instanceof File) {
        uploads.push(apiService.uploadFile(documents.resume, 'document'));
      }

      // Upload certifications
      if (documents.certifications) {
        for (const cert of documents.certifications) {
          if (cert instanceof File) {
            uploads.push(apiService.uploadFile(cert, 'document'));
          }
        }
      }

      await Promise.all(_uploads);
      return true;
    } catch {
      logger.error('Document upload failed:');
      return false;
    }
  }

  private async initiateVerification(_therapistId: string): Promise<VerificationStatus> {
    // In production, this would trigger actual verification workflows
    // Including license verification, background checks, etc.
    
    // For now, set to pending review
    this.verificationCache.set(_therapistId, VerificationStatus.IN_REVIEW);
    
    // Simulate verification process
    setTimeout(() => {
      this.verificationCache.set(_therapistId, VerificationStatus.APPROVED);
      this.notifyVerificationComplete(_therapistId);
    }, 5000);
    
    return VerificationStatus.IN_REVIEW;
  }

  private determineNextSteps(_status: VerificationStatus): string[] {
    switch (_status) {
      case VerificationStatus.PENDING:
        return [
          'Complete document upload',
          'Schedule verification call',
          'Complete background check authorization'
        ];
      
      case VerificationStatus.IN_REVIEW:
        return [
          'Verification in progress (typically 2-3 business days)',
          'Set up payment information',
          'Complete platform training modules'
        ];
      
      case VerificationStatus.APPROVED:
        return [
          'Set up availability calendar',
          'Create professional profile',
          'Begin accepting clients'
        ];
      
      case VerificationStatus.REJECTED:
        return [
          'Review rejection reasons',
          'Submit additional documentation',
          'Contact support for assistance'
        ];
      
      default:
        return [];
    }
  }

  private notifyVerificationComplete(_therapistId: string): void {
    // Send notification via WebSocket
    wsService.emit('therapist:verification:complete', {
      _therapistId,
      _status: this.verificationCache.get(_therapistId)
    });
  }

  // ============================================
  // Appointment Scheduling & Management
  // ============================================

  public async bookAppointment(request: BookingRequest): Promise<Appointment> {
    try {
      // Step 1: Check therapist availability
      const isAvailable = await this.checkAvailability(
        request._therapistId,
        request.date,
        request.time,
        request.duration
      );
      
      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }
      
      // Step 2: Process payment or insurance
      const paymentInfo = await this.processPayment(request);
      
      // Step 3: Create appointment
      const appointment = await apiService.bookAppointment({
        patientId: request.patientId,
        _therapistId: request._therapistId,
        scheduledTime: this.combineDateAndTime(request.date, request.time),
        duration: request.duration,
        type: request.type,
        format: request.format,
        _status: 'scheduled',
        payment: paymentInfo,
        reminder: {
          email: true,
          sms: true,
          push: true,
          leadTime: 1440 // 24 hours
        }
      });
      
      // Step 4: Generate video room if needed
      if (request.format === 'video') {
        appointment.videoUrl = await this.generateVideoRoom(appointment.id);
      }
      
      // Step 5: Send confirmation
      await this.sendAppointmentConfirmation(_appointment);
      
      return appointment;
    } catch {
      logger.error('Appointment booking failed:');
      throw undefined;
    }
  }

  private async checkAvailability(
    _therapistId: string,
    date: Date,
    time: string,
    duration: number
  ): Promise<boolean> {
    // Get therapist's schedule
    const therapist = await apiService.getTherapist(_therapistId);
    
    // Check if time slot is within regular hours
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const regularHours = therapist.availability.regularHours[dayOfWeek];
    
    if (!regularHours) return false;
    
    // Check for conflicts with existing appointments
    const appointments = await apiService.getAppointments(_therapistId, 'scheduled');
    
    const requestedStart = this.combineDateAndTime(date, time);
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);
    
    for (const appt of appointments) {
      const apptEnd = new Date(appt.scheduledTime.getTime() + appt.duration * 60000);
      
      // Check for overlap
      if (
        (requestedStart >= appt.scheduledTime && requestedStart < apptEnd) ||
        (requestedEnd > appt.scheduledTime && requestedEnd <= apptEnd) ||
        (requestedStart <= appt.scheduledTime && requestedEnd >= apptEnd)
      ) {
        return false;
      }
    }
    
    return true;
  }

  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(_Number);
    const combined = new Date(_date);
    combined.setHours(hours || 0, minutes || 0, 0, 0);
    return combined;
  }

  private async processPayment(request: BookingRequest): Promise<PaymentInfo> {
    const therapist = await apiService.getTherapist(request._therapistId);
    
    let _amount = therapist.sessionRate;
    const method = request.paymentMethod;
    
    // Handle sliding scale
    if (method === 'sliding-scale' && therapist.slidingScale) {
      // In production, calculate based on income verification
      _amount = therapist.sessionRate * 0.5; // 50% discount for demo
    }
    
    // Handle insurance
    if (method === 'insurance' && request.insurance) {
      // In production, verify insurance and get copay _amount
      return {
        _amount: 30, // Typical copay
        currency: this.paymentConfig!.currency,
        method: 'insurance',
        _status: 'pending',
        insuranceClaim: {
          claimNumber: `CLM-${Date.now()}`,
          provider: request.insurance.provider,
          _status: 'submitted',
          copay: 30
        }
      };
    }
    
    // Handle self-pay
    if (method === 'self-pay') {
      // In production, process payment via Stripe/PayPal
      const __paymentIntent = await this.createPaymentIntent(_amount, request);
      
      return {
        _amount,
        currency: this.paymentConfig!.currency,
        method: 'self-pay',
        _status: 'pending'
      };
    }
    
    return {
      _amount,
      currency: this.paymentConfig!.currency,
      method,
      _status: 'pending'
    };
  }

  private async createPaymentIntent(_amount: number, _request: BookingRequest): Promise<string> {
    // In production, integrate with actual payment provider
    switch (this.paymentConfig?.provider) {
      case PaymentProvider.STRIPE:
        // Create Stripe payment intent
        return `pi_${Date.now()}`;
      
      case PaymentProvider.PAYPAL:
        // Create PayPal order
        return `paypal_${Date.now()}`;
      
      default:
        return `payment_${Date.now()}`;
    }
  }

  private async sendAppointmentConfirmation(appointment: Appointment): Promise<void> {
    // Send confirmation via WebSocket
    wsService.emit('appointment:confirmed', appointment);
    
    // In production, also send email/SMS confirmation
    logger.info('Appointment confirmed:', appointment);
  }

  public async cancelAppointment(
    appointmentId: string,
    reason: string,
    cancelledBy: 'patient' | 'therapist'
  ): Promise<void> {
    try {
      const appointment = await apiService.cancelAppointment(appointmentId, reason);
      
      // Process refund if needed
      if (appointment.payment?._status === 'paid') {
        await this.processRefund(_appointment);
      }
      
      // Notify both parties
      wsService.emit('appointment:cancelled', {
        appointment,
        reason,
        cancelledBy
      });
    } catch {
      logger.error('Appointment cancellation failed:');
      throw undefined;
    }
  }

  private async processRefund(appointment: Appointment): Promise<void> {
    // Calculate refund based on cancellation policy
    const hoursUntilAppointment = 
      (appointment.scheduledTime.getTime() - Date.now()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    
    if (hoursUntilAppointment >= 24) {
      refundAmount = appointment.payment!._amount; // Full refund
    } else if (hoursUntilAppointment >= 12) {
      refundAmount = appointment.payment!._amount * 0.5; // 50% refund
    }
    // No refund for < 12 hours
    
    if (refundAmount > 0) {
      // In production, process actual refund
      logger.info(`Processing refund of ${refundAmount} for appointment ${appointment.id}`);
    }
  }

  // ============================================
  // Video Session Management
  // ============================================

  public async startVideoSession(appointmentId: string): Promise<VideoSession> {
    try {
      const appointment = await this.getAppointmentDetails(_appointmentId);
      
      // Generate video room and tokens
      const roomId = await this.generateVideoRoom(_appointmentId);
      const tokens = await this.generateVideoTokens(roomId, [
        appointment.patientId,
        appointment._therapistId
      ]);
      
      // Create session
      this.activeVideoSession = {
        sessionId: `session_${Date.now()}`,
        appointmentId,
        roomId,
        participants: [appointment.patientId, appointment.therapistId],
        startTime: new Date(),
        duration: appointment.duration,
        _status: 'active'
      };
      
      // Start recording if enabled
      if (this.videoConfig?.settings.recording) {
        await this.startRecording(_roomId);
      }
      
      // Notify participants
      wsService.emit('video:session:ready', {
        sessionId: this.activeVideoSession.sessionId,
        roomId,
        tokens
      });
      
      return this.activeVideoSession;
    } catch {
      logger.error('Failed to start video session:');
      throw undefined;
    }
  }

  private async getAppointmentDetails(appointmentId: string): Promise<Appointment> {
    // In production, fetch from API
    // For now, return mock data
    return {
      id: appointmentId,
      patientId: 'patient-1',
      _therapistId: 'therapist-1',
      scheduledTime: new Date(),
      duration: 50,
      type: 'followup',
      format: 'video',
      _status: 'in-progress'
    } as Appointment;
  }

  private async generateVideoRoom(appointmentId: string): Promise<string> {
    switch (this.videoConfig?.provider) {
      case VideoProvider.AGORA:
        return `agora_${appointmentId}`;
      
      case VideoProvider.TWILIO:
        return `twilio_${appointmentId}`;
      
      case VideoProvider.ZOOM:
        return `zoom_${appointmentId}`;
      
      default:
        return `room_${appointmentId}`;
    }
  }

  private async generateVideoTokens(
    roomId: string,
    participants: string[]
  ): Promise<Record<string, string>> {
    const tokens: Record<string, string> = {};
    
    for (const participantId of participants) {
      // In production, generate actual provider-specific tokens
      tokens[participantId] = `token_${participantId}_${Date.now()}`;
    }
    
    return tokens;
  }

  private async startRecording(roomId: string): Promise<void> {
    // In production, start actual recording via provider API
    logger.info(`Recording started for room ${roomId}`);
  }

  public async endVideoSession(sessionId: string): Promise<void> {
    if (this.activeVideoSession?.sessionId !== sessionId) {
      throw new Error('Session not found');
    }
    
    try {
      // Stop recording
      if (this.videoConfig?.settings.recording) {
        const recordingUrl = await this.stopRecording(this.activeVideoSession.roomId);
        this.activeVideoSession.recording = recordingUrl;
      }
      
      // Update session status
      this.activeVideoSession.endTime = new Date();
      this.activeVideoSession.status = 'ended';
      
      // Notify participants
      wsService.emit('video:session:ended', {
        sessionId,
        duration: this.activeVideoSession.endTime.getTime() - 
                  this.activeVideoSession.startTime!.getTime()
      });
      
      // Clean up
      this.activeVideoSession = null;
    } catch {
      logger.error('Failed to end video session:');
      throw undefined;
    }
  }

  private async stopRecording(roomId: string): Promise<string> {
    // In production, stop recording and get URL
    return `https://recordings.example.com/${roomId}`;
  }

  // ============================================
  // Event Handlers
  // ============================================

  private handleTherapistAvailability(data: unknown): void {
    // Update local cache
    logger.info('Therapist availability update:', data);
  }

  private handleAppointmentUpdate(data: unknown): void {
    // Handle appointment updates
    logger.info('Appointment update:', data);
  }

  private handleVideoSessionStart(data: unknown): void {
    // Handle video session start
    logger.info('Video session started:', data);
  }

  private handleVideoSessionEnd(data: unknown): void {
    // Handle video session end
    logger.info('Video session ended:', data);
  }

  // ============================================
  // Dashboard & Analytics
  // ============================================

  public async getTherapistDashboard(_therapistId: string): Promise<{
    appointments: Appointment[];
    clients: User[];
    revenue: number;
    ratings: number;
    upcomingSessions: Appointment[];
  }> {
    const therapist = await apiService.getTherapist(_therapistId);
    const appointments = await apiService.getAppointments(_therapistId);
    
    // Calculate metrics
    const revenue = appointments
      .filter(a => a.payment?._status === 'paid')
      .reduce((sum, a) => sum + (a.payment?._amount || 0), 0);
    
    const avgRating = therapist.ratings.length > 0
      ? therapist.ratings.reduce((sum, r) => sum + r.rating, 0) / therapist.ratings.length
      : 0;
    
    const upcomingSessions = appointments
      .filter(a => a._status === 'scheduled' && a.scheduledTime > new Date())
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
      .slice(0, 5);
    
    return {
      appointments,
      clients: [], // Would fetch actual client data
      revenue,
      ratings: avgRating,
      upcomingSessions
    };
  }

  // ============================================
  // Client Management
  // ============================================

  public async getClientNotes(_therapistId: string, clientId: string): Promise<unknown> {
    // In production, fetch encrypted client notes
    return {
      clientId,
      sessions: [],
      treatmentPlan: '',
      progress: [],
      notes: []
    };
  }

  public async updateClientNotes(
    _therapistId: string,
    clientId: string,
    notes: unknown
  ): Promise<void> {
    // In production, save encrypted notes
    logger.info('Updating client notes:', { _therapistId, clientId, notes });
  }
}

// Export singleton instance
export const _therapistService = TherapistService.getInstance();