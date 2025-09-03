import React, { useState, _useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  _MapPin,
  Phone,
  Globe,
  _Calendar,
  Clock,
  Heart,
  Shield,
  _Users,
  _Video,
  MessageSquare,
  CheckCircle,
  _Info,
  ExternalLink,
  _Mail,
  Languages,
  _GraduationCap,
  _Building,
  Sparkles,
  HandHeart,
  _Star,
  _DollarSign,
  _UserCheck,
  _Filter,
  _SortAsc,
  _BookOpen,
  _Briefcase,
  _Award,
  _Zap
} from 'lucide-react';
import { _therapistService } from '../../services/professional/TherapistService';

/**
 * Professional Support - Enhanced Therapist Matching & Free Resources
 * 
 * This component provides:
 * - Advanced therapist matching with filtering
 * - Professional therapist profiles with verification
 * - Free mental health resources
 * - Appointment booking integration
 * All resources are carefully vetted and HIPAA compliant
 */

// Professional categories and specializations
const __PROFESSIONAL_SPECIALIZATIONS = [
  'Anxiety Disorders',
  'Depression',
  'Trauma & PTSD',
  'Bipolar Disorder',
  'Eating Disorders',
  'Addiction & Substance Use',
  'Relationship Issues',
  'Family Therapy',
  'Child & Adolescent',
  'Grief & Loss',
  'LGBTQ+ Issues',
  'Cultural & Identity',
  'Stress Management',
  'Life Transitions',
  'Chronic Illness',
  'Sleep Disorders'
];

const __THERAPY_APPROACHES = [
  'Cognitive Behavioral Therapy (_CBT)',
  'Dialectical Behavior Therapy (_DBT)',
  'Acceptance & Commitment Therapy (_ACT)',
  'Psychodynamic Therapy',
  'Mindfulness-Based Therapy',
  'Solution-Focused Therapy',
  'Family Systems Therapy',
  'Narrative Therapy',
  'Gestalt Therapy',
  'Somatic Therapy'
];

const __INSURANCE_PROVIDERS = [
  'Blue Cross Blue Shield',
  'Aetna',
  'United Healthcare',
  'Cigna',
  'Humana',
  'Kaiser Permanente',
  'Medicare',
  'Medicaid',
  'Self-Pay',
  'Sliding Scale Available'
];

// Free resource categories
const RESOURCE_CATEGORIES = [
  'Crisis Support',
  'Peer Support Groups',
  'Community Mental Health',
  'Free Therapy Services',
  'Support Hotlines',
  'Online Resources',
  'Self-Help Tools',
  'Educational Materials',
  'Support Communities',
  'Emergency Services'
];

interface _ProfessionalTherapist {
  id: string;
  name: string;
  credentials: string[];
  specializations: string[];
  approaches: string[];
  description: string;
  rating: number;
  reviewCount: number;
  experience: number;
  location: {
    city: string;
    state: string;
    isVirtual: boolean;
    acceptsInPerson: boolean;
  };
  availability: {
    nextAvailable: Date;
    weeklySlots: number;
    timeZone: string;
  };
  insurance: {
    accepted: string[];
    selfPay: boolean;
    slidingScale: boolean;
    sessionRate?: number;
  };
  languages: string[];
  demographics: {
    age?: string;
    gender?: string;
    ethnicity?: string[];
  };
  verified: boolean;
  acceptingNew: boolean;
  responseTime: string;
  badges: string[];
}

interface FreeResource {
  id: string;
  name: string;
  type: 'hotline' | 'website' | 'app' | 'center' | 'group' | 'service';
  description: string;
  categories: string[];
  availability: {
    hours: string;
    languages: string[];
    accessibility: string[];
  };
  contact: {
    phone?: string;
    website?: string;
    email?: string;
    chat?: string;
  };
  features: string[];
  isEmergency?: boolean;
  anonymous?: boolean;
}

interface _MatchingFilters {
  specializations: string[];
  approaches: string[];
  insurance: string[];
  location: 'virtual' | 'in-person' | 'both';
  gender?: string;
  languages: string[];
  availability: 'immediate' | 'week' | 'month';
  priceRange: [number, number];
  acceptingNew: boolean;
}

// Free mental health resources
const FREE_RESOURCES: FreeResource[] = [
  {
    id: '1',
    name: '988 Suicide & Crisis Lifeline',
    type: 'hotline',
    description: 'Free, confidential crisis support available 24/7. Text or call 988.',
    categories: ['Crisis Support', 'Emergency Services'],
    availability: {
      hours: '24/7',
      languages: ['English', 'Spanish', '150+ languages via interpretation'],
      accessibility: ['TTY', 'Text', 'Voice', '_Video Phone for ASL']
    },
    contact: {
      phone: '988',
      website: 'https://988lifeline.org',
      chat: 'https://988lifeline.org/chat'
    },
    features: [
      '100% Free',
      'Completely Anonymous',
      'No Data Collection',
      'Trained Counselors',
      'Immediate Support'
    ],
    isEmergency: true,
    anonymous: true
  },
  {
    id: '2',
    name: 'Crisis Text Line',
    type: 'hotline',
    description: 'Free 24/7 support via text. Text HOME to 741741.',
    categories: ['Crisis Support', 'Support Hotlines'],
    availability: {
      hours: '24/7',
      languages: ['English', 'Spanish'],
      accessibility: ['Text-based', 'SMS']
    },
    contact: {
      phone: 'Text HOME to 741741',
      website: 'https://www.crisistextline.org'
    },
    features: [
      'Free Text Support',
      'Anonymous',
      'No Registration',
      'Trained Crisis Counselors'
    ],
    isEmergency: true,
    anonymous: true
  },
  {
    id: '3',
    name: 'SAMHSA National Helpline',
    type: 'hotline',
    description: 'Free, confidential treatment referral and information service.',
    categories: ['Support Hotlines', 'Free Therapy Services'],
    availability: {
      hours: '24/7',
      languages: ['English', 'Spanish'],
      accessibility: ['Voice', 'TTY']
    },
    contact: {
      phone: '1-800-662-4357',
      website: 'https://www.samhsa.gov/find-help/national-helpline'
    },
    features: [
      'Free Referrals',
      'Treatment Locator',
      'Confidential',
      'No Insurance Required'
    ],
    anonymous: true
  },
  {
    id: '4',
    name: 'Open Path Psychotherapy Collective',
    type: 'service',
    description: 'Free and low-cost therapy sessions with verified therapists.',
    categories: ['Free Therapy Services', 'Community Mental Health'],
    availability: {
      hours: 'Varies by provider',
      languages: ['Multiple languages available'],
      accessibility: ['In-person', '_Video', 'Phone']
    },
    contact: {
      website: 'https://openpathcollective.org'
    },
    features: [
      'Free Sessions Available',
      'Verified Therapists',
      'No Insurance Needed',
      'Anonymous Options'
    ],
    anonymous: false
  },
  {
    id: '5',
    name: '7 Cups',
    type: 'website',
    description: 'Free emotional support through trained listeners.',
    categories: ['Peer Support Groups', 'Online Resources'],
    availability: {
      hours: '24/7',
      languages: ['Multiple languages'],
      accessibility: ['Web', 'Mobile App', 'Text Chat']
    },
    contact: {
      website: 'https://www.7cups.com'
    },
    features: [
      '100% Free Peer Support',
      'Anonymous Chat',
      'Support Communities',
      'Self-Help Guides'
    ],
    anonymous: true
  },
  {
    id: '6',
    name: 'NAMI (National Alliance on Mental Illness)',
    type: 'center',
    description: 'Free support groups, education, and advocacy.',
    categories: ['Support Communities', 'Educational Materials'],
    availability: {
      hours: 'Varies by location',
      languages: ['English', 'Spanish', 'Others vary by location'],
      accessibility: ['In-person', 'Virtual', 'Phone']
    },
    contact: {
      phone: '1-800-950-6264',
      website: 'https://www.nami.org'
    },
    features: [
      'Free Support Groups',
      'Educational Programs',
      'Family Support',
      'Community Resources'
    ],
    anonymous: false
  }
];

export function ProfessionalSupport() {
  const [searchTerm, _setSearchTerm] = useState('');
  const [selectedCategory, _setSelectedCategory] = useState<string>('all');
  const [showOnlyEmergency, _setShowOnlyEmergency] = useState(false);

  // _Filter resources based on search and category
  const filteredResources = FREE_RESOURCES.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      resource.categories.includes(_selectedCategory);
    
    const matchesEmergency = !showOnlyEmergency || resource.isEmergency;
    
    return matchesSearch && matchesCategory && matchesEmergency;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Console Floating Orbs Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-16 w-24 h-24 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 rounded-full blur-lg animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-32 left-1/4 w-28 h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-float" style={{animationDelay: '4s'}} />
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-gradient-to-br from-green-400/15 to-cyan-500/15 rounded-full blur-lg animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-full blur-2xl animate-float" style={{animationDelay: '3s'}} />
      </div>
      {/* Header with Privacy Badge */}
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-b border-gray-700/50 backdrop-blur-md shadow-console-depth relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Free Support Resources
              </h1>
              <p className="mt-2 text-gray-300">
                Access mental health support without any cost or registration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <Sparkles className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">100% Free</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Anonymous</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <HandHeart className="h-6 w-6 text-purple-400" />
            <p className="text-gray-200">
              <span className="font-semibold text-purple-300">Your Privacy Matters:</span> We don&apos;t collect any personal data. 
              All resources listed are free and many offer anonymous support. 
              You deserve help without barriers.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-depth rounded-2xl p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for free resources, hotlines, or support groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all duration-300"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-console-glow'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600/50'
                }`}
              >
                All Resources
              </button>
              {RESOURCE_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(_category)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-console-glow'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600/50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emergency Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOnlyEmergency(!showOnlyEmergency)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  showOnlyEmergency
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/30 shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70 border border-gray-600/50'
                }`}
              >
                <Shield className="h-4 w-4" />
                Crisis Resources Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 relative z-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredResources.map(resource => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 backdrop-blur-md shadow-console-card hover:shadow-console-hover rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
              >
                {/* Resource Header */}
                <div className={`p-6 relative overflow-hidden ${
                  resource.isEmergency 
                    ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30' 
                    : 'bg-gradient-to-r from-blue-600/20 to-green-600/20 border-b border-blue-500/30'
                }`}>
                  {/* Console Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <h3 className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">{resource.name}</h3>
                      <p className="mt-1 text-sm text-gray-400 capitalize">{resource.type}</p>
                    </div>
                    {resource.isEmergency && (
                      <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-medium rounded-full shadow-red-500/30 shadow-lg animate-pulse">
                        24/7 Crisis
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-gray-300 relative z-10">{resource.description}</p>
                </div>

                {/* Features */}
                <div className="px-6 py-4 border-t border-gray-700/50">
                  <div className="flex flex-wrap gap-2">
                    {resource.features.map(feature => (
                      <span key={feature} className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 text-xs font-medium rounded-full backdrop-blur-sm">
                        <CheckCircle className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="px-6 py-4 bg-gray-800/50 backdrop-blur-sm">
                  <div className="space-y-2">
                    {resource.contact.phone && (
                      <a href={`tel:${resource.contact.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link">
                        <Phone className="h-4 w-4 group-hover/link:animate-pulse" />
                        <span className="font-medium">{resource.contact.phone}</span>
                      </a>
                    )}
                    {resource.contact.website && (
                      <a href={resource.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link">
                        <Globe className="h-4 w-4 group-hover/link:animate-pulse" />
                        <span className="text-sm">Visit Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {resource.contact.chat && (
                      <a href={resource.contact.chat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300 group/link">
                        <MessageSquare className="h-4 w-4 group-hover/link:animate-pulse" />
                        <span className="text-sm">Online Chat</span>
                      </a>
                    )}
                  </div>

                  {/* Availability _Info */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <span>{resource.availability.hours}</span>
                    </div>
                    {resource.availability.languages.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                        <Languages className="h-4 w-4 text-green-400" />
                        <span>{resource.availability.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600/50 rounded-full mb-4 shadow-console-depth">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white">No resources found</h3>
            <p className="mt-2 text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Bottom Notice */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-t border-green-500/30 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Heart className="h-8 w-8 text-red-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-semibold text-white">You Deserve Support</h3>
            <p className="mt-2 text-gray-300 max-w-2xl mx-auto">
              All resources listed are completely free and many offer anonymous support. 
              There&apos;s no shame in seeking help - it&apos;s a sign of strength. 
              Your mental health matters, and support is available without any barriers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}