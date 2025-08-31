import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Phone,
  Globe,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Filter,
  ChevronRight,
  Heart,
  Shield,
  Award,
  Users,
  Video,
  MessageSquare,
  CheckCircle,
  Info,
  ExternalLink,
  Mail,
  Languages,
  Briefcase,
  GraduationCap,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';

// Therapist specializations
const SPECIALIZATIONS = [
  'Anxiety Disorders',
  'Depression',
  'PTSD/Trauma',
  'Bipolar Disorder',
  'OCD',
  'ADHD',
  'Eating Disorders',
  'Substance Abuse',
  'Relationship Issues',
  'Family Therapy',
  'Child & Adolescent',
  'LGBTQ+ Issues',
  'Grief & Loss',
  'Career Counseling',
  'Anger Management',
  'Self-Esteem',
  'Life Transitions',
  'Chronic Illness',
  'Sleep Disorders',
  'Autism Spectrum'
];

// Therapy modalities
const THERAPY_MODALITIES = [
  { id: 'cbt', name: 'Cognitive Behavioral Therapy (CBT)', description: 'Focuses on changing thought patterns' },
  { id: 'dbt', name: 'Dialectical Behavior Therapy (DBT)', description: 'Combines CBT with mindfulness' },
  { id: 'act', name: 'Acceptance and Commitment Therapy (ACT)', description: 'Emphasizes psychological flexibility' },
  { id: 'emdr', name: 'EMDR', description: 'Eye movement therapy for trauma' },
  { id: 'psychodynamic', name: 'Psychodynamic', description: 'Explores unconscious processes' },
  { id: 'humanistic', name: 'Humanistic', description: 'Person-centered approach' },
  { id: 'somatic', name: 'Somatic Therapy', description: 'Body-based trauma therapy' },
  { id: 'ifs', name: 'Internal Family Systems', description: 'Works with different parts of self' },
  { id: 'mindfulness', name: 'Mindfulness-Based', description: 'Incorporates meditation and awareness' }
];

// Insurance providers
const INSURANCE_PROVIDERS = [
  'Aetna',
  'Blue Cross Blue Shield',
  'Cigna',
  'United Healthcare',
  'Humana',
  'Kaiser Permanente',
  'Anthem',
  'Medicaid',
  'Medicare',
  'Tricare',
  'Self-Pay/Sliding Scale'
];

interface Therapist {
  id: string;
  name: string;
  title: string;
  credentials: string[];
  specializations: string[];
  modalities: string[];
  yearsExperience: number;
  languages: string[];
  profileImage?: string;
  bio: string;
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  licenses: {
    type: string;
    number: string;
    state: string;
  }[];
  availability: {
    nextAvailable: Date;
    sessionTypes: ('in-person' | 'video' | 'phone')[];
    evenings: boolean;
    weekends: boolean;
  };
  pricing: {
    sessionFee: number;
    slidingScale: boolean;
    insurance: string[];
  };
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    distance?: number;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    bookingUrl?: string;
  };
  ratings: {
    overall: number;
    totalReviews: number;
    categories: {
      communication: number;
      empathy: number;
      effectiveness: number;
      professionalism: number;
    };
  };
  verified: boolean;
  acceptingNewPatients: boolean;
}

interface FilterOptions {
  specialization: string;
  modality: string;
  insurance: string;
  sessionType: 'all' | 'in-person' | 'video' | 'phone';
  availability: 'all' | 'evenings' | 'weekends' | 'immediate';
  priceRange: 'all' | 'low' | 'medium' | 'high';
  distance: number;
  languages: string[];
}

// Mock therapist data (in production, this would come from an API)
const MOCK_THERAPISTS: Therapist[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Licensed Clinical Psychologist',
    credentials: ['Ph.D.', 'Licensed Psychologist'],
    specializations: ['Anxiety Disorders', 'Depression', 'PTSD/Trauma', 'ADHD'],
    modalities: ['cbt', 'dbt', 'emdr'],
    yearsExperience: 15,
    languages: ['English', 'Spanish'],
    bio: 'I specialize in evidence-based treatments for anxiety, depression, and trauma. My approach is warm, collaborative, and tailored to each individual\'s unique needs.',
    education: [
      { degree: 'Ph.D. in Clinical Psychology', institution: 'Stanford University', year: 2008 },
      { degree: 'M.A. in Psychology', institution: 'UCLA', year: 2004 }
    ],
    licenses: [
      { type: 'Psychology', number: 'PSY12345', state: 'CA' }
    ],
    availability: {
      nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      sessionTypes: ['in-person', 'video'],
      evenings: true,
      weekends: false
    },
    pricing: {
      sessionFee: 200,
      slidingScale: true,
      insurance: ['Aetna', 'Blue Cross Blue Shield', 'Cigna']
    },
    location: {
      address: '123 Wellness Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      distance: 2.5
    },
    contact: {
      phone: '(555) 123-4567',
      email: 'dr.johnson@example.com',
      website: 'https://drjohnsontherapy.com',
      bookingUrl: 'https://drjohnsontherapy.com/book'
    },
    ratings: {
      overall: 4.8,
      totalReviews: 127,
      categories: {
        communication: 4.9,
        empathy: 4.8,
        effectiveness: 4.7,
        professionalism: 4.9
      }
    },
    verified: true,
    acceptingNewPatients: true
  },
  {
    id: '2',
    name: 'Michael Chen, LMFT',
    title: 'Licensed Marriage & Family Therapist',
    credentials: ['LMFT', 'Certified DBT Therapist'],
    specializations: ['Relationship Issues', 'Family Therapy', 'Depression', 'Life Transitions'],
    modalities: ['dbt', 'act', 'humanistic'],
    yearsExperience: 10,
    languages: ['English', 'Mandarin', 'Cantonese'],
    bio: 'I help individuals, couples, and families navigate life\'s challenges with compassion and practical tools for lasting change.',
    education: [
      { degree: 'M.A. in Marriage & Family Therapy', institution: 'USC', year: 2013 }
    ],
    licenses: [
      { type: 'LMFT', number: 'LMFT98765', state: 'CA' }
    ],
    availability: {
      nextAvailable: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sessionTypes: ['video', 'phone'],
      evenings: true,
      weekends: true
    },
    pricing: {
      sessionFee: 150,
      slidingScale: false,
      insurance: ['United Healthcare', 'Anthem', 'Self-Pay/Sliding Scale']
    },
    location: {
      address: 'Online Only',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      distance: 0
    },
    contact: {
      phone: '(555) 234-5678',
      email: 'mchen.therapy@example.com',
      bookingUrl: 'https://calendly.com/mchentherapy'
    },
    ratings: {
      overall: 4.6,
      totalReviews: 89,
      categories: {
        communication: 4.7,
        empathy: 4.8,
        effectiveness: 4.5,
        professionalism: 4.6
      }
    },
    verified: true,
    acceptingNewPatients: true
  },
  {
    id: '3',
    name: 'Dr. Emily Rodriguez',
    title: 'Clinical Social Worker',
    credentials: ['LCSW', 'Trauma Specialist'],
    specializations: ['PTSD/Trauma', 'Grief & Loss', 'Chronic Illness', 'LGBTQ+ Issues'],
    modalities: ['emdr', 'somatic', 'mindfulness'],
    yearsExperience: 20,
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: 'Specializing in trauma-informed care with a focus on healing and resilience. I create a safe, inclusive space for all clients.',
    education: [
      { degree: 'DSW in Clinical Social Work', institution: 'Columbia University', year: 2010 },
      { degree: 'MSW', institution: 'NYU', year: 2003 }
    ],
    licenses: [
      { type: 'LCSW', number: 'LCSW54321', state: 'NY' }
    ],
    availability: {
      nextAvailable: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      sessionTypes: ['in-person', 'video'],
      evenings: false,
      weekends: false
    },
    pricing: {
      sessionFee: 175,
      slidingScale: true,
      insurance: ['Medicare', 'Medicaid', 'Blue Cross Blue Shield']
    },
    location: {
      address: '456 Healing Blvd',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      distance: 3.2
    },
    contact: {
      phone: '(555) 345-6789',
      email: 'drodriguez@example.com',
      website: 'https://drodrigueztherapy.com'
    },
    ratings: {
      overall: 4.9,
      totalReviews: 156,
      categories: {
        communication: 4.9,
        empathy: 5.0,
        effectiveness: 4.8,
        professionalism: 4.9
      }
    },
    verified: true,
    acceptingNewPatients: false
  }
];

export function ProfessionalSupport() {
  const [therapists, setTherapists] = useState<Therapist[]>(MOCK_THERAPISTS);
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>(MOCK_THERAPISTS);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    specialization: 'all',
    modality: 'all',
    insurance: 'all',
    sessionType: 'all',
    availability: 'all',
    priceRange: 'all',
    distance: 50,
    languages: []
  });
  const [savedTherapists, setSavedTherapists] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter therapists based on search and filters
  useEffect(() => {
    let filtered = [...therapists];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Specialization filter
    if (filters.specialization !== 'all') {
      filtered = filtered.filter(t =>
        t.specializations.includes(filters.specialization)
      );
    }

    // Modality filter
    if (filters.modality !== 'all') {
      filtered = filtered.filter(t =>
        t.modalities.includes(filters.modality)
      );
    }

    // Insurance filter
    if (filters.insurance !== 'all') {
      filtered = filtered.filter(t =>
        t.pricing.insurance.includes(filters.insurance)
      );
    }

    // Session type filter
    if (filters.sessionType !== 'all') {
      filtered = filtered.filter(t =>
        t.availability.sessionTypes.includes(filters.sessionType as any)
      );
    }

    // Availability filter
    if (filters.availability === 'evenings') {
      filtered = filtered.filter(t => t.availability.evenings);
    } else if (filters.availability === 'weekends') {
      filtered = filtered.filter(t => t.availability.weekends);
    } else if (filters.availability === 'immediate') {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t =>
        new Date(t.availability.nextAvailable) <= threeDaysFromNow
      );
    }

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(t => {
        const fee = t.pricing.sessionFee;
        if (filters.priceRange === 'low') return fee <= 100;
        if (filters.priceRange === 'medium') return fee > 100 && fee <= 200;
        if (filters.priceRange === 'high') return fee > 200;
        return true;
      });
    }

    // Sort by distance if location-based
    filtered.sort((a, b) => (a.location.distance || 999) - (b.location.distance || 999));

    setFilteredTherapists(filtered);
  }, [searchQuery, filters, therapists]);

  // Save/unsave therapist
  const toggleSaveTherapist = (therapistId: string) => {
    setSavedTherapists(prev => {
      const updated = prev.includes(therapistId)
        ? prev.filter(id => id !== therapistId)
        : [...prev, therapistId];
      
      localStorage.setItem('savedTherapists', JSON.stringify(updated));
      toast.success(prev.includes(therapistId) ? 'Therapist removed from saved' : 'Therapist saved');
      return updated;
    });
  };

  // Load saved therapists
  useEffect(() => {
    const saved = localStorage.getItem('savedTherapists');
    if (saved) {
      setSavedTherapists(JSON.parse(saved));
    }
  }, []);

  // Request appointment
  const requestAppointment = (therapist: Therapist) => {
    if (therapist.contact.bookingUrl) {
      window.open(therapist.contact.bookingUrl, '_blank');
    } else {
      toast.success(`Contact ${therapist.name} at ${therapist.contact.phone} to schedule`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find Professional Support</h1>
              <p className="text-gray-600 mt-1">Connect with licensed mental health professionals</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters {showFilters && '✓'}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, specialization, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b shadow-sm overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <select
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Specializations</option>
                    {SPECIALIZATIONS.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Therapy Type
                  </label>
                  <select
                    value={filters.modality}
                    onChange={(e) => setFilters({ ...filters, modality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    {THERAPY_MODALITIES.map(mod => (
                      <option key={mod.id} value={mod.id}>{mod.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance
                  </label>
                  <select
                    value={filters.insurance}
                    onChange={(e) => setFilters({ ...filters, insurance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Insurance</option>
                    {INSURANCE_PROVIDERS.map(ins => (
                      <option key={ins} value={ins}>{ins}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type
                  </label>
                  <select
                    value={filters.sessionType}
                    onChange={(e) => setFilters({ ...filters, sessionType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="in-person">In-Person</option>
                    <option value="video">Video</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters({ ...filters, availability: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Any Time</option>
                    <option value="immediate">Within 3 Days</option>
                    <option value="evenings">Evening Hours</option>
                    <option value="weekends">Weekends</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Prices</option>
                    <option value="low">Under $100</option>
                    <option value="medium">$100-$200</option>
                    <option value="high">Over $200</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-gray-600">
          Found <span className="font-semibold">{filteredTherapists.length}</span> therapists
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Therapists Grid/List */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTherapists.map(therapist => (
              <TherapistCard
                key={therapist.id}
                therapist={therapist}
                isSaved={savedTherapists.includes(therapist.id)}
                onSave={() => toggleSaveTherapist(therapist.id)}
                onSelect={() => setSelectedTherapist(therapist)}
                onBook={() => requestAppointment(therapist)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTherapists.map(therapist => (
              <TherapistListItem
                key={therapist.id}
                therapist={therapist}
                isSaved={savedTherapists.includes(therapist.id)}
                onSave={() => toggleSaveTherapist(therapist.id)}
                onSelect={() => setSelectedTherapist(therapist)}
                onBook={() => requestAppointment(therapist)}
              />
            ))}
          </div>
        )}

        {filteredTherapists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No therapists found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>

      {/* Therapist Detail Modal */}
      <AnimatePresence>
        {selectedTherapist && (
          <TherapistDetailModal
            therapist={selectedTherapist}
            isSaved={savedTherapists.includes(selectedTherapist.id)}
            onClose={() => setSelectedTherapist(null)}
            onSave={() => toggleSaveTherapist(selectedTherapist.id)}
            onBook={() => requestAppointment(selectedTherapist)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Therapist Card Component
function TherapistCard({ therapist, isSaved, onSave, onSelect, onBook }: {
  therapist: Therapist;
  isSaved: boolean;
  onSave: () => void;
  onSelect: () => void;
  onBook: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer"
      onClick={onSelect}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{therapist.name}</h3>
            <p className="text-sm text-gray-600">{therapist.title}</p>
            <div className="flex items-center gap-2 mt-2">
              {therapist.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
              {therapist.acceptingNewPatients ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  Accepting Patients
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                  Waitlist Only
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 font-medium">{therapist.ratings.overall}</span>
          </div>
          <span className="text-sm text-gray-500">({therapist.ratings.totalReviews} reviews)</span>
        </div>

        {/* Specializations */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {therapist.specializations.slice(0, 3).map(spec => (
              <span key={spec} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {spec}
              </span>
            ))}
            {therapist.specializations.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                +{therapist.specializations.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span>${therapist.pricing.sessionFee}/session</span>
            {therapist.pricing.slidingScale && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Sliding Scale
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Next: {new Date(therapist.availability.nextAvailable).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              {therapist.location.distance
                ? `${therapist.location.distance} miles`
                : 'Online Only'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Book Consultation
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Therapist List Item Component
function TherapistListItem({ therapist, isSaved, onSave, onSelect, onBook }: {
  therapist: Therapist;
  isSaved: boolean;
  onSave: () => void;
  onSelect: () => void;
  onBook: () => void;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6"
    >
      <div className="flex gap-6">
        {/* Left Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{therapist.name}</h3>
              <p className="text-gray-600">{therapist.title}</p>
              <div className="flex items-center gap-3 mt-2">
                {therapist.verified && (
                  <span className="inline-flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                )}
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 font-medium">{therapist.ratings.overall}</span>
                  <span className="text-sm text-gray-500 ml-1">({therapist.ratings.totalReviews})</span>
                </div>
              </div>
            </div>
            <button
              onClick={onSave}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          </div>

          <p className="text-gray-700 mb-3 line-clamp-2">{therapist.bio}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {therapist.specializations.map(spec => (
              <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {spec}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Experience:</span>
              <p className="font-medium">{therapist.yearsExperience} years</p>
            </div>
            <div>
              <span className="text-gray-500">Session Fee:</span>
              <p className="font-medium">${therapist.pricing.sessionFee}</p>
            </div>
            <div>
              <span className="text-gray-500">Next Available:</span>
              <p className="font-medium">
                {new Date(therapist.availability.nextAvailable).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <p className="font-medium">
                {therapist.location.distance
                  ? `${therapist.location.distance} miles`
                  : 'Online Only'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onBook}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            Book Now
          </button>
          <button
            onClick={onSelect}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            View Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Therapist Detail Modal
function TherapistDetailModal({ therapist, isSaved, onClose, onSave, onBook }: {
  therapist: Therapist;
  isSaved: boolean;
  onClose: () => void;
  onSave: () => void;
  onBook: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Therapist Profile</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Basic Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{therapist.name}</h3>
                  <p className="text-lg text-gray-600">{therapist.title}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {therapist.verified && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        <CheckCircle className="h-4 w-4" />
                        Verified Provider
                      </span>
                    )}
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-semibold text-lg">{therapist.ratings.overall}</span>
                      <span className="text-gray-500 ml-1">({therapist.ratings.totalReviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onSave}
                  className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Heart className={`h-6 w-6 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">About</h4>
              <p className="text-gray-700 leading-relaxed">{therapist.bio}</p>
            </div>

            {/* Specializations & Modalities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {therapist.specializations.map(spec => (
                    <span key={spec} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Therapy Approaches</h4>
                <div className="flex flex-wrap gap-2">
                  {therapist.modalities.map(mod => {
                    const modality = THERAPY_MODALITIES.find(m => m.id === mod);
                    return (
                      <span key={mod} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {modality?.name || mod}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Education & Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Education</h4>
                <div className="space-y-2">
                  {therapist.education.map((edu, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{edu.degree}</p>
                        <p className="text-sm text-gray-600">{edu.institution}, {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Licenses</h4>
                <div className="space-y-2">
                  {therapist.licenses.map((license, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{license.type}</p>
                        <p className="text-sm text-gray-600">{license.state} - {license.number}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Practical Information */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Session Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Session Fee</p>
                    <p className="text-gray-700">${therapist.pricing.sessionFee} per session</p>
                    {therapist.pricing.slidingScale && (
                      <p className="text-sm text-green-600 mt-1">Sliding scale available</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Insurance</p>
                    <p className="text-gray-700 text-sm">{therapist.pricing.insurance.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Session Types</p>
                    <p className="text-gray-700 capitalize">{therapist.availability.sessionTypes.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Availability</p>
                    <p className="text-gray-700">
                      {therapist.availability.evenings && 'Evenings '}
                      {therapist.availability.weekends && 'Weekends'}
                      {!therapist.availability.evenings && !therapist.availability.weekends && 'Weekdays'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Languages className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Languages</p>
                    <p className="text-gray-700">{therapist.languages.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-700">
                      {therapist.location.address === 'Online Only'
                        ? 'Online Only'
                        : `${therapist.location.city}, ${therapist.location.state}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Actions */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={onBook}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Calendar className="h-5 w-5" />
                Book Consultation
              </button>
              <a
                href={`tel:${therapist.contact.phone}`}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Call {therapist.contact.phone}
              </a>
              {therapist.contact.website && (
                <a
                  href={therapist.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-5 w-5" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}