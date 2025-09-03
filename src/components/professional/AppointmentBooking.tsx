import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  _Clock,
  CreditCard,
  User,
  _Phone,
  _Mail,
  Shield,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  _FileText,
  Video,
  MapPin,
  _Users
} from 'lucide-react';
import { therapistService } from '../../services/professional/TherapistService';

interface AppointmentBookingProps {
  therapistId: string;
  onClose: () => void;
  onSuccess: (appointmentId: string) => void;
}

interface TimeSlot {
  _time: string;
  available: boolean;
  type: 'morning' | 'afternoon' | 'evening';
}

interface BookingStep {
  id: number;
  title: string;
  completed: boolean;
}

const BOOKING_STEPS: BookingStep[] = [
  { id: 1, title: 'Select Date & Time', completed: false },
  { id: 2, title: 'Session Details', completed: false },
  { id: 3, title: 'Personal Information', completed: false },
  { id: 4, title: 'Insurance & Payment', completed: false },
  { id: 5, title: 'Confirmation', completed: false }
];

const generateTimeSlots = (_date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const startHour = 9;
  const endHour = 17;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 50) {
      const _time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const type = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      const available = Math.random() > 0.3; // 70% availability rate
      
      slots.push({ _time, available, type });
    }
  }
  
  return slots;
};

const getNextSevenDays = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

export function AppointmentBooking({ therapistId, onClose, onSuccess }: AppointmentBookingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, _setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableDays, _setAvailableDays] = useState<Date[]>([]);
  const [timeSlots, _setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [therapist, _setTherapist] = useState<unknown>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    sessionType: 'initial',
    format: 'video',
    reason: '',
    concerns: '',
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    emergencyContact: {
      name: '',
      phone: ''
    },
    // Insurance
    hasInsurance: true,
    insuranceProvider: '',
    memberId: '',
    groupNumber: '',
    paymentMethod: 'insurance'
  });

  useEffect(() => {
    setAvailableDays(getNextSevenDays());
    // Load therapist data
    const loadTherapist = async () => {
      // In production, fetch from API
      setTherapist({
        id: therapistId,
        name: 'Dr. Sarah Chen, PhD',
        sessionRate: 180,
        insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'United Healthcare']
      });
    };
    loadTherapist();
  }, [therapistId]);

  useEffect(() => {
    if (selectedDate) {
      setTimeSlots(generateTimeSlots(selectedDate));
    }
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (_time: string) => {
    setSelectedTime(_time);
  };

  const nextStep = () => {
    if (currentStep < BOOKING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent as keyof typeof formData]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child as string]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field as keyof typeof formData]: value }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // In production, submit to booking API
      const appointmentId = await therapistService.bookAppointment({
        therapistId,
        patientId: 'user-1',
        date: selectedDate!,
        _time: selectedTime,
        duration: 50,
        type: formData.sessionType as unknown,
        format: formData.format as unknown,
        reason: formData.reason,
        insurance: formData.hasInsurance ? {
          provider: formData.insuranceProvider,
          memberId: formData.memberId,
          groupNumber: formData.groupNumber
        } : undefined,
        paymentMethod: formData.paymentMethod as unknown
      });
      
      onSuccess(appointmentId.id);
    } catch (error) {
      logger.error('Booking failed:');
      // Handle undefined
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (_currentStep) {
      case 1:
        return selectedDate && selectedTime;
      case 2:
        return formData.sessionType && formData.format;
      case 3:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 4:
        return formData.hasInsurance ? 
          (formData.insuranceProvider && formData.memberId) : 
          formData.paymentMethod;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Book Appointment</h2>
              <p className="text-blue-100">with {therapist?.name || 'Professional Therapist'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-between">
            {BOOKING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-white text-blue-600 border-white' 
                    : 'border-blue-300 text-blue-200'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < BOOKING_STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-white' : 'bg-blue-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Date & Time Selection */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-semibold mb-6">Select Date & Time</h3>
                
                {/* Date Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3" htmlFor="has-insurance">Available Dates</label>
                  <div className="grid grid-cols-7 gap-2">
                    {availableDays.map((date, index) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNumber = date.getDate();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(date)}
                          className={`p-3 rounded-lg text-center transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="text-xs font-medium">{dayName}</div>
                          <div className="text-lg font-bold">{dayNumber}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3" htmlFor="has-insurance">
                      Available Times for {selectedDate.toLocaleDateString()}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {['morning', 'afternoon', 'evening'].map(period => {
                        const periodSlots = timeSlots.filter(slot => slot.type === period && slot.available);
                        if (periodSlots.length === 0) return null;
                        
                        return (
                          <div key={period} className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-600 capitalize">{period}</h4>
                            <div className="space-y-2">
                              {periodSlots.map(slot => (
                                <button
                                  key={slot._time}
                                  onClick={() => handleTimeSelect(slot._time)}
                                  className={`w-full p-2 rounded-md text-sm transition-colors ${
                                    selectedTime === slot._time
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {slot._time}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Session Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold">Session Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3" htmlFor="has-insurance">Session Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'initial', label: 'Initial Consultation', description: 'First _time meeting' },
                      { value: 'followup', label: 'Follow-up Session', description: 'Continuing treatment' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => updateFormData('sessionType', option.value)}
                        className={`p-4 rounded-lg border-2 text-left transition-colors ${
                          formData.sessionType === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3" htmlFor="has-insurance">Session Format</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'video', label: 'Video Call', icon: Video, description: 'Secure video session' },
                      { value: 'in-person', label: 'In-Person', icon: MapPin, description: 'Office visit' }
                    ].map(option => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => updateFormData('format', option.value)}
                          className={`p-4 rounded-lg border-2 text-left transition-colors ${
                            formData.format === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{option.label}</span>
                          </div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Reason for Visit (_Optional)</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => updateFormData('reason', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Briefly describe what you'd like to discuss..."
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Personal Information */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-4">Emergency Contact (_Optional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContact.name}
                        onChange={(e) => updateFormData('emergencyContact.name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Phone</label>
                      <input
                        type="tel"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => updateFormData('emergencyContact.phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Insurance & Payment */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold">Insurance & Payment</h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Session Rate: ${therapist?.sessionRate || 180}</span>
                  </div>
                  <p className="text-sm text-blue-700">Standard 50-minute therapy session</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="has-insurance"
                      name="insurance-option"
                      checked={formData.hasInsurance}
                      onChange={(e) => updateFormData('hasInsurance', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="has-insurance" className="font-medium">I have insurance</label>
                  </div>

                  {formData.hasInsurance && (
                    <div className="ml-7 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Insurance Provider *</label>
                        <select
                          value={formData.insuranceProvider}
                          onChange={(e) => updateFormData('insuranceProvider', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select provider...</option>
                          {therapist?.insuranceAccepted?.map((provider: string) => (
                            <option key={provider} value={provider}>{provider}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Member ID *</label>
                          <input
                            type="text"
                            value={formData.memberId}
                            onChange={(e) => updateFormData('memberId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="has-insurance">Group Number</label>
                          <input
                            type="text"
                            value={formData.groupNumber}
                            onChange={(e) => updateFormData('groupNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Your insurance is accepted. Typical copay: $25-50
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      id="self-pay"
                      name="insurance-option"
                      checked={!formData.hasInsurance}
                      onChange={(e) => updateFormData('hasInsurance', !e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="self-pay" className="font-medium">I'll pay out-of-pocket</label>
                  </div>

                  {!formData.hasInsurance && (
                    <div className="ml-7 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        {[
                          { value: 'full-rate', label: `Full Rate - $${therapist?.sessionRate || 180}` },
                          { value: 'sliding-scale', label: 'Sliding Scale - Based on income' }
                        ].map(option => (
                          <label key={option.value} className="flex items-center gap-3" htmlFor="has-insurance">
                            <input
                              type="radio"
                              name="payment-method"
                              value={option.value}
                              checked={formData.paymentMethod === option.value}
                              onChange={(e) => updateFormData('paymentMethod', e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Confirmation */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold">Confirm Your Appointment</h3>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">
                        {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>{therapist?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {formData.format === 'video' ? (
                        <Video className="w-5 h-5 text-blue-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      )}
                      <span>{formData.format === 'video' ? 'Video Session' : 'In-Person Session'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span>
                        {formData.hasInsurance 
                          ? `Insurance: ${formData.insuranceProvider}` 
                          : `Payment: ${formData.paymentMethod === 'sliding-scale' ? 'Sliding Scale' : `$${therapist?.sessionRate}`}`
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-medium text-yellow-800">Please Note:</p>
                      <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
                        <li>You'll receive a confirmation email within 5 minutes</li>
                        <li>Please arrive 10 minutes early (or join video call early)</li>
                        <li>Cancellations must be made 24 hours in advance</li>
                        <li>A secure video link will be sent before your session</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-700">
                    Your information is encrypted and HIPAA-compliant
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {currentStep < BOOKING_STEPS.length ? (
              <button
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceedToNext()}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}