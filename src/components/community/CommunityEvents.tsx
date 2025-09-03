import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Video, Users, Plus } from 'lucide-react';
import { format, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';
import { toast } from 'react-hot-toast';
import { communityService, Event, CreateEventDto } from '../../services/community/communityService';
import { useAuth } from '../../hooks/useAuth';

interface EventCardProps {
  event: Event;
  onRegister: (_eventId: string) => void;
  onUnregister: (_eventId: string) => void;
}

function EventCard({ event, onRegister, onUnregister }: EventCardProps) {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isUpcoming = startDate > new Date();
  const isFull = event.maxAttendees ? event.currentAttendees >= event.maxAttendees : false;

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      workshop: 'bg-blue-100 text-blue-700',
      'support-session': 'bg-purple-100 text-purple-700',
      meditation: 'bg-green-100 text-green-700',
      'group-therapy': 'bg-red-100 text-red-700',
      webinar: 'bg-orange-100 text-orange-700',
      social: 'bg-pink-100 text-pink-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getDateLabel = () => {
    if (isToday(startDate)) return 'Today';
    if (isTomorrow(startDate)) return 'Tomorrow';
    if (isThisWeek(startDate)) return format(startDate, 'EEEE');
    return format(startDate, 'MMM d');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      {/* Event Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                {event.type.replace('-', ' ')}
              </span>
              {event.isOnline ? (
                <span className="inline-flex items-center space-x-1 text-xs text-gray-500">
                  <Video className="h-3 w-3" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>In-Person</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
          </div>
        </div>

        {/* Date and Time */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-3 text-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              <span className="font-medium">{getDateLabel()}</span>
              {' • '}
              {format(startDate, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')} ({event.timezone})
            </span>
          </div>
          {event.location && (
            <div className="flex items-center space-x-3 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{event.location}</span>
            </div>
          )}
        </div>

        {/* Host Info */}
        <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
            {event.host.name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{event.host.name}</p>
            {event.host.credentials && (
              <p className="text-xs text-gray-500">{event.host.credentials}</p>
            )}
          </div>
        </div>

        {/* Attendance */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{event.currentAttendees}</span>
              {event.maxAttendees && (
                <span> / {event.maxAttendees}</span>
              )}
              {' attending'}
            </span>
          </div>
          {isFull && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              Event Full
            </span>
          )}
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Button */}
        {isUpcoming && (
          <div>
            {event.isRegistered ? (
              <button
                onClick={() => onUnregister(event.id)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel Registration
              </button>
            ) : (
              <button
                onClick={() => onRegister(event.id)}
                disabled={isFull}
                className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>{isFull ? 'Event Full' : 'Register'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
}

function CreateEventModal({ isOpen, onClose, groupId }: CreateEventModalProps) {
  const queryClient = useQueryClient();
  const [formData, _setFormData] = useState<CreateEventDto>({
    title: '',
    description: '',
    type: 'workshop' as Event['type'],
    startTime: new Date(),
    endTime: addDays(new Date(), 1),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isOnline: true,
    location: '',
    meetingLink: '',
    maxAttendees: undefined,
    groupId,
    tags: [],
  });
  const [tagInput, _setTagInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CreateEventDto) => communityService.createEvent(data),
    onSuccess: () => {
      toast.success('Event created successfully!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create event');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (formData.endTime <= formData.startTime) {
      toast.error('End time must be after start time');
      return;
    }
    
    mutation.mutate(formData);
  };

  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.toLowerCase().replace(/\s+/g, '-')],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                id="event-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Weekly Mindfulness Meditation"
                required
                maxLength={200}
                aria-required="true"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="event-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what attendees can expect..."
                rows={4}
                required
                maxLength={2000}
                aria-required="true"
              />
            </div>

            {/* Event Type */}
            <div>
              <label htmlFor="event-type" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select
                id="event-type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Event['type'] }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-required="true"
              >
                <option value="workshop">Workshop</option>
                <option value="support-session">Support Session</option>
                <option value="meditation">Meditation</option>
                <option value="group-therapy">Group Therapy</option>
                <option value="webinar">Webinar</option>
                <option value="social">Social Gathering</option>
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-start-time"
                  type="datetime-local"
                  value={format(formData.startTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>
              <div>
                <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-end-time"
                  type="datetime-local"
                  value={format(formData.endTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: new Date(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            {/* Location Type */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 mb-2">
                  Location Type
                </legend>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center" htmlFor="location-online">
                    <input
                      type="radio"
                      name="location-type"
                      id="location-online"
                      checked={formData.isOnline}
                      onChange={() => setFormData(prev => ({ ...prev, isOnline: true }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Online</span>
                  </label>
                  <label className="flex items-center" htmlFor="location-online">
                    <input
                      type="radio"
                      name="location-type"
                      id="location-in-person"
                      checked={!formData.isOnline}
                      onChange={() => setFormData(prev => ({ ...prev, isOnline: false }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">In-Person</span>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* Meeting Link or Location */}
            {formData.isOnline ? (
              <div>
                <label htmlFor="meeting-link" className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link
                </label>
                <input
                  id="meeting-link"
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://zoom.us/j/..."
                  aria-describedby="meeting-link-hint"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  id="event-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Community Center, 123 Main St"
                  aria-describedby="location-hint"
                />
              </div>
            )}

            {/* Max Attendees */}
            <div>
              <label htmlFor="max-attendees" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Attendees (_optional)
              </label>
              <input
                id="max-attendees"
                type="number"
                value={formData.maxAttendees || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxAttendees: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Leave empty for unlimited"
                min="1"
                aria-describedby="max-attendees-hint"
              />
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="event-tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="event-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tags..."
                  aria-label="Add a tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CommunityEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [___showCreateModal, _setShowCreateModal] = useState(false);
  const [selectedType, _setSelectedType] = useState<string>('all');
  const [dateFilter, _setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        return { start: now, end: addDays(now, 1) };
      case 'week':
        return { start: now, end: addDays(now, 7) };
      case 'month':
        return { start: now, end: addDays(now, 30) };
      default:
        return { start: now, end: undefined };
    }
  };

  const dateRange = getDateRange();

  // Fetch events
  const { data, isLoading, error } = useQuery({
    queryKey: ['events', selectedType, dateFilter],
    queryFn: () => communityService.getEvents({
      type: selectedType === 'all' ? undefined : selectedType,
      startDate: dateRange.start,
      endDate: dateRange.end,
      limit: 20,
    }),
  });

  // Register for event mutation
  const __registerMutation   = useMutation({
    mutationFn: (_eventId: string) => communityService.registerForEvent(_eventId),
    onSuccess: () => {
      toast.success('Successfully registered for event!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      toast.error('Failed to register for event');
    },
  });

  // Unregister from event mutation
  const __unregisterMutation   = useMutation({
    mutationFn: (_eventId: string) => communityService.unregisterFromEvent(_eventId),
    onSuccess: () => {
      toast.success('Registration cancelled');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => {
      toast.error('Failed to cancel registration');
    },
  });

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'workshop', label: 'Workshops' },
    { value: 'support-session', label: 'Support Sessions' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'group-therapy', label: 'Group Therapy' },
    { value: 'webinar', label: 'Webinars' },
    { value: 'social', label: 'Social' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load events. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Date Filter */}
        <div className="flex items-center space-x-2">
          {(['all', 'today', 'week', 'month'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === filter
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All Dates' : 
               filter === 'today' ? 'Today' :
               filter === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === type.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.events && data.events.length > 0 ? (
          data.events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={registerMutation.mutate}
              onUnregister={unregisterMutation.mutate}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming events. Create one to bring the community together!</p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}