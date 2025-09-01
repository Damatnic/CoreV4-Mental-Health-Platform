import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Mail, Calendar, Clock, MapPin, Star, Shield,
  Video, MessageSquare, FileText, Activity, Award, AlertCircle,
  ChevronRight, Edit2, MoreVertical, Heart, Brain, Pill,
  Users, Briefcase, Stethoscope, UserCheck, Settings
} from 'lucide-react';

interface CareProvider {
  id: string;
  name: string;
  role: 'therapist' | 'psychiatrist' | 'primary_care' | 'case_manager' | 'peer_support' | 'specialist';
  specialty?: string;
  credentials: string;
  profileImage?: string;
  contactInfo: {
    phone: string;
    email?: string;
    officePhone?: string;
    emergencyPhone?: string;
  };
  availability: {
    status: 'available' | 'busy' | 'away' | 'offline';
    nextAvailable?: Date;
    officeHours: string;
    preferredContactMethod: 'phone' | 'email' | 'portal' | 'text';
  };
  location?: {
    name: string;
    address: string;
    isVirtual: boolean;
  };
  lastContact?: Date;
  nextAppointment?: Date;
  rating?: number;
  yearsExperience?: number;
  insuranceAccepted: string[];
  languages?: string[];
  specializations?: string[];
  notes?: string;
  emergencyProtocol?: string;
}

interface CareTeamDashboardProps {
  providers?: CareProvider[];
  onContactProvider?: (provider: CareProvider, method: string) => void;
  onScheduleAppointment?: (provider: CareProvider) => void;
  onViewProviderDetails?: (provider: CareProvider) => void;
  onEditProvider?: (provider: CareProvider) => void;
  onAddProvider?: () => void;
}

export function CareTeamDashboard({
  providers = [],
  onContactProvider,
  onScheduleAppointment,
  onViewProviderDetails,
  onEditProvider,
  onAddProvider
}: CareTeamDashboardProps) {
  const [selectedProvider, setSelectedProvider] = useState<CareProvider | null>(null);
  const [showContactOptions, setShowContactOptions] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');

  // Get provider icon based on role
  const getProviderIcon = (role: string) => {
    switch (role) {
      case 'therapist': return <Brain className="h-5 w-5" />;
      case 'psychiatrist': return <Pill className="h-5 w-5" />;
      case 'primary_care': return <Stethoscope className="h-5 w-5" />;
      case 'case_manager': return <Briefcase className="h-5 w-5" />;
      case 'peer_support': return <Users className="h-5 w-5" />;
      case 'specialist': return <UserCheck className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'therapist': return 'Therapist';
      case 'psychiatrist': return 'Psychiatrist';
      case 'primary_care': return 'Primary Care';
      case 'case_manager': return 'Case Manager';
      case 'peer_support': return 'Peer Support';
      case 'specialist': return 'Specialist';
      default: return 'Provider';
    }
  };

  // Get availability status color
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // Filter providers by role
  const filteredProviders = filterRole === 'all' 
    ? providers 
    : providers.filter(p => p.role === filterRole);

  // Group providers by role
  const groupedProviders = filteredProviders.reduce((acc, provider) => {
    if (!acc[provider.role]) {
      acc[provider.role] = [];
    }
    acc[provider.role].push(provider);
    return acc;
  }, {} as Record<string, CareProvider[]>);

  // Primary providers (therapist, psychiatrist, primary care)
  const primaryProviders = providers.filter(p => 
    ['therapist', 'psychiatrist', 'primary_care'].includes(p.role)
  );

  // Support team
  const supportTeam = providers.filter(p => 
    ['case_manager', 'peer_support', 'specialist'].includes(p.role)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Your Care Team</h3>
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
            {providers.length} Providers
          </span>
        </div>
        <button
          onClick={onAddProvider}
          className="px-3 py-1 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
        >
          Add Provider
        </button>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterRole('all')}
          className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
            filterRole === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Providers
        </button>
        {['therapist', 'psychiatrist', 'primary_care', 'case_manager', 'peer_support'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1 text-sm rounded-lg whitespace-nowrap transition-colors ${
              filterRole === role
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getRoleDisplayName(role)}
          </button>
        ))}
      </div>

      {/* Providers Grid */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Primary Care Team */}
        {primaryProviders.length > 0 && filterRole === 'all' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Primary Care Team</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {primaryProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onContact={onContactProvider}
                  onSchedule={onScheduleAppointment}
                  onViewDetails={onViewProviderDetails}
                  onEdit={onEditProvider}
                />
              ))}
            </div>
          </div>
        )}

        {/* Support Team */}
        {supportTeam.length > 0 && filterRole === 'all' && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Support Team</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supportTeam.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onContact={onContactProvider}
                  onSchedule={onScheduleAppointment}
                  onViewDetails={onViewProviderDetails}
                  onEdit={onEditProvider}
                />
              ))}
            </div>
          </div>
        )}

        {/* Filtered View */}
        {filterRole !== 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onContact={onContactProvider}
                onSchedule={onScheduleAppointment}
                onViewDetails={onViewProviderDetails}
                onEdit={onEditProvider}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredProviders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-center">
              No {filterRole === 'all' ? 'providers' : getRoleDisplayName(filterRole).toLowerCase()} found
            </p>
            <button
              onClick={onAddProvider}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Add a provider
            </button>
          </div>
        )}
      </div>

      {/* Emergency Contact Banner */}
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">Emergency Contact</span>
          </div>
          <button className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
            Call 988
          </button>
        </div>
      </div>
    </div>
  );
}

// Provider Card Component
function ProviderCard({
  provider,
  onContact,
  onSchedule,
  onViewDetails,
  onEdit
}: {
  provider: CareProvider;
  onContact?: (provider: CareProvider, method: string) => void;
  onSchedule?: (provider: CareProvider) => void;
  onViewDetails?: (provider: CareProvider) => void;
  onEdit?: (provider: CareProvider) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const getProviderIcon = (role: string) => {
    switch (role) {
      case 'therapist': return <Brain className="h-5 w-5" />;
      case 'psychiatrist': return <Pill className="h-5 w-5" />;
      case 'primary_care': return <Stethoscope className="h-5 w-5" />;
      case 'case_manager': return <Briefcase className="h-5 w-5" />;
      case 'peer_support': return <Users className="h-5 w-5" />;
      case 'specialist': return <UserCheck className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'therapist': return 'Therapist';
      case 'psychiatrist': return 'Psychiatrist';
      case 'primary_care': return 'Primary Care';
      case 'case_manager': return 'Case Manager';
      case 'peer_support': return 'Peer Support';
      case 'specialist': return 'Specialist';
      default: return 'Provider';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all relative"
    >
      {/* Provider Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {provider.profileImage ? (
              <img 
                src={provider.profileImage} 
                alt={provider.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white">
                {getProviderIcon(provider.role)}
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
              getAvailabilityColor(provider.availability.status)
            }`} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{provider.name}</h4>
            <p className="text-xs text-gray-600">{provider.credentials}</p>
          </div>
        </div>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Role & Specialty */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
            {getRoleDisplayName(provider.role)}
          </span>
          {provider.specialty && (
            <span className="text-xs text-gray-600">{provider.specialty}</span>
          )}
        </div>
        {provider.specializations && provider.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {provider.specializations.slice(0, 3).map((spec, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                {spec}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-3 w-3 mr-2" />
          <span>{provider.contactInfo.phone}</span>
        </div>
        {provider.contactInfo.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-3 w-3 mr-2" />
            <span className="truncate">{provider.contactInfo.email}</span>
          </div>
        )}
        {provider.location && (
          <div className="flex items-center text-sm text-gray-600">
            {provider.location.isVirtual ? (
              <Video className="h-3 w-3 mr-2" />
            ) : (
              <MapPin className="h-3 w-3 mr-2" />
            )}
            <span className="truncate">{provider.location.name}</span>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Office Hours</p>
        <p className="text-sm text-gray-700">{provider.availability.officeHours}</p>
        {provider.nextAppointment && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center text-xs text-blue-700">
              <Calendar className="h-3 w-3 mr-1" />
              Next: {new Date(provider.nextAppointment).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      {provider.rating && (
        <div className="flex items-center space-x-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < Math.floor(provider.rating!) 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          ))}
          <span className="text-xs text-gray-600 ml-1">({provider.rating})</span>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onContact?.(provider, provider.availability.preferredContactMethod)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Contact
        </button>
        <button
          onClick={() => onSchedule?.(provider)}
          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Schedule
        </button>
      </div>

      {/* Actions Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-12 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden"
          >
            <button
              onClick={() => {
                onViewDetails?.(provider);
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </button>
            <button
              onClick={() => {
                onEdit?.(provider);
                setShowActions(false);
              }}
              className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Info
            </button>
            {provider.contactInfo.emergencyPhone && (
              <button
                onClick={() => {
                  onContact?.(provider, 'emergency');
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex items-center"
              >
                <Phone className="h-4 w-4 mr-2" />
                Emergency Call
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}