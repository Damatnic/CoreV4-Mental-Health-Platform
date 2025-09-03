import { logger } from '@/utils/logger';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Calendar,
  Video,
  MessageSquare,
  Award,
  GraduationCap,
  Languages,
  Shield,
  CheckCircle,
  _Heart,
  _BookOpen,
  Users,
  _FileText,
  Play,
  Pause,
  Briefcase,
  Volume2,
  VolumeX,
  _ChevronLeft,
  _ChevronRight,
  ThumbsUp,
  Flag,
  Share2
} from 'lucide-react';
import { _therapistService } from '../../services/professional/TherapistService';

interface TherapistProfileProps {
  therapistId: string;
  onBookAppointment: () => void;
  _onClose?: () => void;
}

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: Date;
  verified: boolean;
  helpful: number;
  specialization: string;
}

interface EducationItem {
  degree: string;
  institution: string;
  year: number;
  field: string;
}

interface ExperienceItem {
  title: string;
  organization: string;
  startYear: number;
  endYear?: number;
  description: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    patientName: 'Sarah M.',
    rating: 5,
    comment: 'Dr. Chen has been instrumental in helping me manage my anxiety. Her approach is compassionate yet practical, and she provides concrete tools I can use daily. The EMDR sessions were particularly effective for processing past trauma.',
    date: new Date('2024-01-15'),
    verified: true,
    helpful: 23,
    specialization: 'Anxiety Disorders'
  },
  {
    id: '2',
    patientName: 'Michael R.',
    rating: 5,
    comment: 'After struggling with depression for years, I finally found someone who truly understands. The CBT techniques have been life-changing, and Dr. Chen creates such a safe, non-judgmental space.',
    date: new Date('2024-02-08'),
    verified: true,
    helpful: 18,
    specialization: 'Depression'
  },
  {
    id: '3',
    patientName: 'Jennifer L.',
    rating: 4,
    comment: 'Great therapist with deep knowledge of trauma therapy. The mindfulness-based approach really resonated with me. Only reason for 4 stars is that scheduling can sometimes be challenging due to high demand.',
    date: new Date('2024-02-22'),
    verified: true,
    helpful: 12,
    specialization: 'Trauma & PTSD'
  }
];

const mockEducation: EducationItem[] = [
  {
    degree: 'Ph.D. in Clinical Psychology',
    institution: 'Stanford University',
    year: 2010,
    field: 'Clinical Psychology with specialization in Anxiety Disorders'
  },
  {
    degree: 'M.A. in Psychology',
    institution: 'University of California, Berkeley',
    year: 2008,
    field: 'Cognitive Behavioral Psychology'
  },
  {
    degree: 'B.A. in Psychology',
    institution: 'UCLA',
    year: 2006,
    field: 'Psychology with Minor in Neuroscience'
  }
];

const mockExperience: ExperienceItem[] = [
  {
    title: 'Senior Clinical Psychologist',
    organization: 'Bay Area Mental Health Clinic',
    startYear: 2015,
    description: 'Leading trauma-informed care initiatives and supervising junior clinicians. Specialized in complex PTSD and anxiety disorders.'
  },
  {
    title: 'Staff Psychologist',
    organization: 'UCSF Medical Center',
    startYear: 2012,
    endYear: 2015,
    description: 'Provided individual and group therapy for patients with various mental health conditions. Developed specialized programs for anxiety management.'
  },
  {
    title: 'Postdoctoral Fellow',
    organization: 'Palo Alto Veterans Affairs',
    startYear: 2010,
    endYear: 2012,
    description: 'Specialized training in EMDR and trauma therapy. Worked extensively with veterans experiencing PTSD and adjustment disorders.'
  }
];

export function TherapistProfile({ therapistId, onBookAppointment, _onClose }: TherapistProfileProps) {
  const [therapist, _setTherapist] = useState<unknown>(null);
  const [activeTab, _setActiveTab] = useState<'overview' | 'reviews' | 'credentials' | 'availability'>('overview');
  const [___selectedReview, _setSelectedReview] = useState<Review | null>(null);
  const [isVideoPlaying, _setIsVideoPlaying] = useState(false);
  const [isMuted, _setIsMuted] = useState(true);
  const [____loading, _setLoading] = useState(true);

  useEffect(() => {
    const loadTherapist = async () => {
      setLoading(true);
      try {
        // In production, fetch from API
        const _therapistData = {
          id: therapistId,
          name: 'Dr. Sarah Chen, PhD',
          title: 'Licensed Clinical Psychologist',
          credentials: ['PhD Clinical Psychology', 'Licensed Psychologist', 'EMDR Certified'],
          specializations: ['Anxiety Disorders', 'Trauma & PTSD', 'Depression'],
          approaches: ['Cognitive Behavioral Therapy (_CBT)', 'EMDR', 'Mindfulness-Based Therapy'],
          description: 'Dr. Chen is a compassionate and experienced clinical psychologist specializing in anxiety, trauma, and depression. With over 12 years of experience, she combines evidence-based therapeutic approaches with a warm, supportive style to help clients achieve lasting change.',
          longBio: `Dr. Sarah Chen brings over 12 years of dedicated experience in clinical psychology, with a particular focus on anxiety disorders, trauma recovery, and depression treatment. She earned her Ph.D. in Clinical Psychology from Stanford University and has since been committed to providing compassionate, evidence-based care.

Dr. Chen&apos;s approach integrates cognitive-behavioral therapy (_CBT) with EMDR and mindfulness-based interventions, allowing her to tailor treatment to each client&apos;s unique needs. She believes in creating a safe, non-judgmental space where clients feel heard and supported as they work toward their goals.

Her expertise in trauma-informed care has made her particularly effective in helping clients process difficult experiences and develop healthy coping strategies. Dr. Chen is fluent in English and Mandarin, and she values cultural sensitivity in her practice.

When not in session, Dr. Chen enjoys reading, hiking, and spending time with her family. She is also involved in training the next generation of therapists and regularly presents at professional conferences.`,
          rating: 4.9,
          reviewCount: 127,
          experience: 12,
          location: {
            city: 'San Francisco',
            state: 'CA',
            address: '123 Wellness St, Suite 400',
            isVirtual: true,
            acceptsInPerson: true
          },
          availability: {
            nextAvailable: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            weeklySlots: 15,
            timeZone: 'PST',
            regularHours: {
              monday: '9:00 AM - 5:00 PM',
              tuesday: '9:00 AM - 5:00 PM',
              wednesday: '10:00 AM - 6:00 PM',
              thursday: '9:00 AM - 5:00 PM',
              friday: '9:00 AM - 4:00 PM',
              saturday: 'Closed',
              sunday: 'Closed'
            }
          },
          insurance: {
            accepted: ['Blue Cross Blue Shield', 'Aetna', 'United Healthcare'],
            selfPay: true,
            slidingScale: true,
            sessionRate: 180
          },
          languages: ['English', 'Mandarin'],
          demographics: {
            age: '35-44',
            gender: 'Female',
            ethnicity: ['Asian American']
          },
          verified: true,
          acceptingNew: true,
          responseTime: '< 24 hours',
          badges: ['EMDR Certified', 'Trauma Specialist', 'LGBTQ+ Affirming'],
          contact: {
            phone: '(555) 123-4567',
            email: 'dr.chen@example.com',
            website: 'https://drchenwellness.com'
          },
          virtualPlatforms: ['Secure Video Portal', 'Zoom (_Healthcare)', 'Doxy.me'],
          photos: [
            '/api/placeholder/300/400', // Professional headshot
            '/api/placeholder/400/300', // Office photo
            '/api/placeholder/400/300'  // Therapy room
          ],
          introVideo: '/api/placeholder/video/intro.mp4',
          specialtyAreas: [
            {
              name: 'Anxiety Disorders',
              description: 'Specialized treatment for generalized anxiety, social anxiety, panic disorder, and phobias using CBT and exposure therapy.',
              experience: '10+ years'
            },
            {
              name: 'Trauma & PTSD',
              description: 'EMDR-certified therapist with extensive experience in complex trauma, PTSD, and childhood trauma recovery.',
              experience: '8+ years'
            },
            {
              name: 'Depression',
              description: 'Evidence-based treatment for major depression, including CBT, behavioral activation, and mindfulness approaches.',
              experience: '12+ years'
            }
          ]
        };
        
        setTherapist(_therapistData);
      } catch {
        logger.error('Failed to load therapist:');
      } finally {
        setLoading(false);
      }
    };

    loadTherapist();
  }, [therapistId]);

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-current' 
                : i < rating 
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-300'
            }`} 
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (_loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Therapist not found</h2>
          <p className="text-gray-600">The requested therapist profile could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <img
                    src={therapist.photos[0] || "/api/placeholder/150/200"}
                    alt={therapist.name}
                    className="w-32 h-40 rounded-xl object-cover shadow-lg"
                  />
                  {therapist.verified && (
                    <div className="absolute -top-2 -right-2 bg-blue-600 rounded-full p-1">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{therapist.name}</h1>
                    {therapist.verified && (
                      <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-3">{therapist.title}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    {renderStars(therapist.rating, 'lg')}
                    <span className="text-sm text-gray-500">
                      {therapist.reviewCount} reviews
                    </span>
                    <span className="text-sm text-gray-500">
                      {therapist.experience} years experience
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {therapist.specializations.map((spec: string) => (
                      <span key={spec} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{therapist.location.city}, {therapist.location.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Languages className="w-4 h-4" />
                      <span>{therapist.languages.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Response time: {therapist.responseTime}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {therapist.badges.map((badge: string) => (
                      <span key={badge} className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                        <Award className="w-3 h-3" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    ${therapist.insurance.sessionRate}
                  </div>
                  <div className="text-sm text-gray-600">per session</div>
                  {therapist.insurance.slidingScale && (
                    <div className="text-xs text-blue-600 mt-1">Sliding scale available</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={onBookAppointment}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Message
                    </button>
                    <button className="border border-gray-300 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Next available: {therapist.availability.nextAvailable.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'reviews', label: 'Reviews', icon: Star },
                { id: 'credentials', label: 'Credentials', icon: GraduationCap },
                { id: 'availability', label: 'Availability', icon: Calendar }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as unknown)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === 'reviews' && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                        {therapist.reviewCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                {/* About */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">About Dr. Chen</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {therapist.longBio}
                    </p>
                  </div>
                </div>

                {/* Intro Video */}
                {therapist.introVideo && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">Introduction Video</h2>
                    <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                      <div className="aspect-video">
                        <video
                          className="w-full h-full object-cover"
                          poster="/api/placeholder/600/400"
                          muted={isMuted}
                        >
                          <source src={therapist.introVideo} type="video/mp4" />
                        </video>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                          className="bg-white/90 hover:bg-white p-4 rounded-full shadow-lg transition-colors"
                        >
                          {isVideoPlaying ? (
                            <Pause className="w-8 h-8 text-gray-800" />
                          ) : (
                            <Play className="w-8 h-8 text-gray-800" />
                          )}
                        </button>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specialty Areas */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Specialty Areas</h2>
                  <div className="space-y-6">
                    {therapist.specialtyAreas.map((area: unknown, index: number) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{area.name}</h3>
                          <span className="text-sm text-gray-500">{area.experience}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{area.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treatment Approaches */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Treatment Approaches</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {therapist.approaches.map((approach: string) => (
                      <div key={approach} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-700">{approach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{therapist.acceptingNew ? 'Accepting new clients' : 'Waitlist only'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-gray-400" />
                      <span>Virtual sessions available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{therapist.location.acceptsInPerson ? 'In-person available' : 'Virtual only'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>HIPAA compliant</span>
                    </div>
                  </div>
                </div>

                {/* Insurance */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">Insurance & Payment</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Accepted Insurance:</p>
                      <div className="space-y-1">
                        {therapist.insurance.accepted.map((ins: string) => (
                          <div key={ins} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{ins}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Payment Options:</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>Insurance</span>
                        </div>
                        {therapist.insurance.selfPay && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Self-pay</span>
                          </div>
                        )}
                        {therapist.insurance.slidingScale && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Sliding scale</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {therapist.contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${therapist.contact.phone}`} className="text-blue-600 hover:underline">
                          {therapist.contact.phone}
                        </a>
                      </div>
                    )}
                    {therapist.contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${therapist.contact.email}`} className="text-blue-600 hover:underline">
                          {therapist.contact.email}
                        </a>
                      </div>
                    )}
                    {therapist.contact.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={therapist.contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Review Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{therapist.rating}</div>
                    {renderStars(therapist.rating, 'lg')}
                    <div className="text-sm text-gray-500 mt-1">{therapist.reviewCount} reviews</div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = Math.floor(Math.random() * 30) + (stars === 5 ? 80 : stars === 4 ? 30 : 5);
                        const percentage = (count / therapist.reviewCount) * 100;
                        
                        return (
                          <div key={stars} className="flex items-center gap-3">
                            <span className="text-sm w-12">{stars} star</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-4">
                {mockReviews.map(review => (
                  <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.patientName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.patientName}</span>
                            {review.verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating, 'sm')}
                            <span className="text-xs text-gray-500">
                              {review.date.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {review.specialization}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.helpful})</span>
                      </button>
                      
                      <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                        <Flag className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                {/* Education */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Education</h2>
                  <div className="space-y-6">
                    {mockEducation.map((edu, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                          <p className="text-blue-600">{edu.institution}</p>
                          <p className="text-sm text-gray-600 mt-1">{edu.field}</p>
                          <p className="text-sm text-gray-500">{edu.year}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Licenses & Certifications */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Licenses & Certifications</h2>
                  <div className="space-y-4">
                    {therapist.credentials.map((credential: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-green-200 rounded-lg">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-900">{credential}</span>
                        <span className="ml-auto text-sm text-green-600">Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Professional Experience */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Professional Experience</h2>
                  <div className="space-y-6">
                    {mockExperience.map((exp, index) => (
                      <div key={index} className="relative">
                        {index !== mockExperience.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-purple-600">{exp.organization}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {exp.startYear} - {exp.endYear || 'Present'}
                            </p>
                            <p className="text-sm text-gray-700">{exp.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                {/* Regular Hours */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Regular Hours</h2>
                  <div className="space-y-3">
                    {Object.entries(therapist.availability.regularHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="font-medium capitalize text-gray-900">{day}</span>
                        <span className="text-gray-600">{hours as string}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Timezone: {therapist.availability.timeZone}
                    </p>
                  </div>
                </div>

                {/* Session Formats */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Session Options</h2>
                  <div className="space-y-4">
                    {therapist.location.isVirtual && (
                      <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg">
                        <Video className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Virtual Sessions</h3>
                          <p className="text-sm text-gray-600">Secure video therapy sessions</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Platforms: {therapist.virtualPlatforms?.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {therapist.location.acceptsInPerson && (
                      <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg">
                        <MapPin className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">In-Person Sessions</h3>
                          <p className="text-sm text-gray-600">Office visits available</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {therapist.location.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Booking Info */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-6">Booking Information</h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-900">
                          {therapist.acceptingNew ? 'Accepting New Clients' : 'Waitlist Available'}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Next available appointment: {therapist.availability.nextAvailable.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Typical response time:</span>
                        <span className="font-medium">{therapist.responseTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weekly availability:</span>
                        <span className="font-medium">{therapist.availability.weeklySlots} slots</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={onBookAppointment}
                    className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>

                {/* Cancellation Policy */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Policies</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Cancellation Policy</h3>
                      <p className="text-gray-600">
                        24-hour notice required for cancellations. Late cancellations may be charged.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">No-Show Policy</h3>
                      <p className="text-gray-600">
                        No-show appointments will be charged the full session fee.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Emergency Contact</h3>
                      <p className="text-gray-600">
                        For mental health emergencies, call 988 or go to your nearest emergency room.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}