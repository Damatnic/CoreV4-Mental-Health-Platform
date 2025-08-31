import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Globe, Clock, Filter, Search, Navigation, ExternalLink } from 'lucide-react';

interface Resource {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'therapist' | 'support_group' | 'crisis_center' | 'emergency';
  phone?: string;
  website?: string;
  address?: string;
  distance?: number;
  hours?: string;
  services: string[];
  acceptsInsurance?: boolean;
  walkIn?: boolean;
  rating?: number;
  lat?: number;
  lng?: number;
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    name: 'Community Crisis Center',
    type: 'crisis_center',
    phone: '555-0100',
    website: 'https://example.com/crisis',
    address: '123 Main St, City, State 12345',
    distance: 2.3,
    hours: '24/7',
    services: ['Crisis Intervention', 'Emergency Assessment', 'Safety Planning', 'Referrals'],
    walkIn: true,
    rating: 4.8
  },
  {
    id: '2',
    name: 'Regional Medical Center - Emergency Psychiatric Services',
    type: 'hospital',
    phone: '555-0200',
    address: '456 Hospital Blvd, City, State 12345',
    distance: 3.7,
    hours: '24/7',
    services: ['Emergency Psychiatric Care', 'Inpatient Services', 'Crisis Stabilization'],
    acceptsInsurance: true,
    walkIn: true,
    rating: 4.5
  },
  {
    id: '3',
    name: 'Mental Health Associates',
    type: 'clinic',
    phone: '555-0300',
    website: 'https://example.com/mha',
    address: '789 Wellness Ave, City, State 12345',
    distance: 5.1,
    hours: 'Mon-Fri 8am-6pm, Sat 9am-2pm',
    services: ['Therapy', 'Psychiatry', 'Group Therapy', 'Crisis Counseling'],
    acceptsInsurance: true,
    walkIn: false,
    rating: 4.7
  },
  {
    id: '4',
    name: 'Peer Support Network',
    type: 'support_group',
    phone: '555-0400',
    website: 'https://example.com/support',
    address: '321 Community Center, City, State 12345',
    distance: 4.2,
    hours: 'Various meeting times',
    services: ['Peer Support Groups', 'Recovery Programs', 'Family Support'],
    walkIn: true,
    rating: 4.9
  }
];

interface CrisisResourcesProps {
  location?: GeolocationPosition | null;
}

export function CrisisResources({ location }: CrisisResourcesProps) {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [filteredResources, setFilteredResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Filter resources based on type and search query
  useEffect(() => {
    let filtered = resources;

    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.type === selectedType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.services.some(s => s.toLowerCase().includes(query)) ||
        r.address?.toLowerCase().includes(query)
      );
    }

    // Sort by distance if location is available
    if (location) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    setFilteredResources(filtered);
  }, [resources, selectedType, searchQuery, location]);

  // Fetch real resources (in production, this would call an API)
  useEffect(() => {
    if (location) {
      fetchNearbyResources(location.coords.latitude, location.coords.longitude);
    }
  }, [location]);

  const fetchNearbyResources = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      // In production, this would make an API call to fetch real resources
      // For now, we'll simulate with mock data and calculated distances
      const resourcesWithDistance = MOCK_RESOURCES.map(resource => ({
        ...resource,
        distance: calculateDistance(lat, lng, resource.lat || 0, resource.lng || 0)
      }));
      setResources(resourcesWithDistance);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Simple distance calculation (in production, use proper geospatial calculations)
    return Math.random() * 10; // Mock distance in miles
  };

  const handleCallResource = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const handleGetDirections = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
  };

  const resourceTypes = [
    { value: 'all', label: 'All Resources', icon: Globe },
    { value: 'emergency', label: 'Emergency', icon: Phone },
    { value: 'hospital', label: 'Hospitals', icon: MapPin },
    { value: 'crisis_center', label: 'Crisis Centers', icon: MapPin },
    { value: 'clinic', label: 'Clinics', icon: MapPin },
    { value: 'support_group', label: 'Support Groups', icon: MapPin }
  ];

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources, services, or locations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {resourceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>{showMap ? 'List' : 'Map'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Location Status */}
      {location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2">
          <Navigation className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700">
            Showing resources near your location
          </span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding resources near you...</p>
        </div>
      )}

      {/* Resources List */}
      {!isLoading && !showMap && (
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-600">No resources found matching your criteria.</p>
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSearchQuery('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            filteredResources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onCall={handleCallResource}
                onGetDirections={handleGetDirections}
              />
            ))
          )}
        </div>
      )}

      {/* Map View (Placeholder) */}
      {!isLoading && showMap && (
        <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Interactive map view coming soon</p>
            <p className="text-sm text-gray-500 mt-2">
              Use list view to see available resources
            </p>
          </div>
        </div>
      )}

      {/* National Hotlines Footer */}
      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">National Crisis Hotlines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HotlineCard
            name="988 Suicide & Crisis Lifeline"
            number="988"
            description="24/7 crisis support"
            onCall={() => handleCallResource('988')}
          />
          <HotlineCard
            name="Crisis Text Line"
            number="741741"
            description="Text HOME to 741741"
            onCall={() => window.location.href = 'sms:741741?body=HOME'}
          />
          <HotlineCard
            name="SAMHSA National Helpline"
            number="1-800-662-4357"
            description="Treatment referral and information"
            onCall={() => handleCallResource('18006624357')}
          />
          <HotlineCard
            name="Veterans Crisis Line"
            number="1-800-273-8255"
            description="Press 1 for veterans"
            onCall={() => handleCallResource('18002738255')}
          />
        </div>
      </div>
    </div>
  );
}

// Resource Card Component
function ResourceCard({ resource, onCall, onGetDirections }: any) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      emergency: 'bg-red-100 text-red-700',
      hospital: 'bg-blue-100 text-blue-700',
      crisis_center: 'bg-purple-100 text-purple-700',
      clinic: 'bg-green-100 text-green-700',
      support_group: 'bg-yellow-100 text-yellow-700',
      therapist: 'bg-indigo-100 text-indigo-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
              {resource.type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {resource.distance && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{resource.distance.toFixed(1)} miles away</span>
            </div>
          )}
        </div>
        {resource.rating && (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium text-gray-700">{resource.rating}</span>
          </div>
        )}
      </div>

      {resource.address && (
        <p className="text-gray-600 mb-2">{resource.address}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {resource.hours && (
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{resource.hours}</span>
          </div>
        )}
        {resource.walkIn && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            Walk-ins Welcome
          </span>
        )}
        {resource.acceptsInsurance && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            Accepts Insurance
          </span>
        )}
      </div>

      {resource.services.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
          <div className="flex flex-wrap gap-1">
            {resource.services.map((service, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {resource.phone && (
          <button
            onClick={() => onCall(resource.phone)}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Phone className="h-4 w-4" />
            <span>Call</span>
          </button>
        )}
        {resource.address && (
          <button
            onClick={() => onGetDirections(resource.address)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <Navigation className="h-4 w-4" />
            <span>Directions</span>
          </button>
        )}
        {resource.website && (
          <button
            onClick={() => window.open(resource.website, '_blank')}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Website</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Hotline Card Component
function HotlineCard({ name, number, description, onCall }: any) {
  return (
    <div className="bg-white rounded-lg p-4 flex items-center justify-between">
      <div>
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        <p className="text-lg font-bold text-blue-600 mt-1">{number}</p>
      </div>
      <button
        onClick={onCall}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Phone className="h-5 w-5" />
      </button>
    </div>
  );
}