import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Clock,
  Heart,
  Shield,
  Users,
  Video,
  MessageSquare,
  CheckCircle,
  Info,
  ExternalLink,
  Mail,
  Languages,
  GraduationCap,
  Building,
  Sparkles,
  HandHeart
} from 'lucide-react';

/**
 * Professional Support - 100% Free Resources
 * 
 * This component provides access to free mental health resources
 * No payments, no premium tiers, no hidden costs
 * All resources are carefully vetted and completely free
 */

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
      accessibility: ['TTY', 'Text', 'Voice', 'Video Phone for ASL']
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
      accessibility: ['In-person', 'Video', 'Phone']
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyEmergency, setShowOnlyEmergency] = useState(false);

  // Filter resources based on search and category
  const filteredResources = FREE_RESOURCES.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      resource.categories.includes(selectedCategory);
    
    const matchesEmergency = !showOnlyEmergency || resource.isEmergency;
    
    return matchesSearch && matchesCategory && matchesEmergency;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header with Privacy Badge */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Free Support Resources
              </h1>
              <p className="mt-2 text-gray-600">
                Access mental health support without any cost or registration
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">100% Free</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Anonymous</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <HandHeart className="h-6 w-6 text-purple-600" />
            <p className="text-purple-800">
              <span className="font-semibold">Your Privacy Matters:</span> We don't collect any personal data. 
              All resources listed are free and many offer anonymous support. 
              You deserve help without barriers.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for free resources, hotlines, or support groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Resources
              </button>
              {RESOURCE_CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  showOnlyEmergency
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredResources.map(resource => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Resource Header */}
                <div className={`p-6 ${resource.isEmergency ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-blue-50 to-green-50'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{resource.name}</h3>
                      <p className="mt-1 text-sm text-gray-600">{resource.type}</p>
                    </div>
                    {resource.isEmergency && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                        24/7 Crisis
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-gray-700">{resource.description}</p>
                </div>

                {/* Features */}
                <div className="px-6 py-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {resource.features.map(feature => (
                      <span key={feature} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <CheckCircle className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="px-6 py-4 bg-gray-50">
                  <div className="space-y-2">
                    {resource.contact.phone && (
                      <a href={`tel:${resource.contact.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">{resource.contact.phone}</span>
                      </a>
                    )}
                    {resource.contact.website && (
                      <a href={resource.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">Visit Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {resource.contact.chat && (
                      <a href={resource.contact.chat} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm">Online Chat</span>
                      </a>
                    )}
                  </div>

                  {/* Availability Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{resource.availability.hours}</span>
                    </div>
                    {resource.availability.languages.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <Languages className="h-4 w-4" />
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No resources found</h3>
            <p className="mt-2 text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Bottom Notice */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-t border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">You Deserve Support</h3>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              All resources listed are completely free and many offer anonymous support. 
              There's no shame in seeking help - it's a sign of strength. 
              Your mental health matters, and support is available without any barriers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}