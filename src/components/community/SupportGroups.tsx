import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Lock, Globe, UserPlus, Settings, Calendar, MessageSquare, TrendingUp, Shield, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { _communityService, SupportGroup, CreateGroupDto } from '../../services/community/communityService';
import { useAuth } from '../../hooks/useAuth';

interface GroupCardProps {
  group: SupportGroup;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onManage: (group: SupportGroup) => void;
}

function GroupCard({ group, onJoin, onLeave, onManage }: GroupCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === group.createdBy;
  const isModerator = group.moderators.includes(user?.id || '');

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      anxiety: 'bg-purple-100 text-purple-700',
      depression: 'bg-blue-100 text-blue-700',
      trauma: 'bg-red-100 text-red-700',
      addiction: 'bg-orange-100 text-orange-700',
      grief: 'bg-gray-100 text-gray-700',
      relationships: 'bg-pink-100 text-pink-700',
      'self-esteem': 'bg-green-100 text-green-700',
      other: 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-t-xl relative">
        {group.isPrivate && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center space-x-1">
            <Lock className="h-3 w-3 text-gray-700" />
            <span className="text-xs font-medium text-gray-700">Private</span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Group Info */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
            {(isOwner || isModerator) && (
              <button
                onClick={() => onManage(group)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Manage group"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(group.category)}`}>
            {group.category}
          </span>
          
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{group.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-y border-gray-100">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{group.memberCount}</span> members
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{group.postCount}</span> posts
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {group.settings?.allowAnonymous && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
              <Shield className="h-3 w-3" />
              <span>Anonymous posts</span>
            </span>
          )}
          {group.settings?.peerSupport && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full">
              <Heart className="h-3 w-3" />
              <span>Peer support</span>
            </span>
          )}
          {group.settings?.crisisSupport && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
              <Shield className="h-3 w-3" />
              <span>Crisis support</span>
            </span>
          )}
        </div>

        {/* Action Button */}
        {group.isMember ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => onLeave(group.id)}
              className="flex-1 mr-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Leave Group
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Group
            </button>
          </div>
        ) : (
          <button
            onClick={() => onJoin(group.id)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{group.requiresApproval ? 'Request to Join' : 'Join Group'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateGroupDto>({
    name: '',
    description: '',
    category: 'other' as any,
    isPrivate: false,
    requiresApproval: false,
    guidelines: [],
    settings: {
      allowAnonymous: true,
      autoModeration: true,
      crisisSupport: true,
      peerSupport: true,
    },
  });
  const [guidelineInput, setGuidelineInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CreateGroupDto) => _communityService.createGroup(data),
    onSuccess: () => {
      toast.success('Support group created successfully!');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      onClose();
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Failed to create group');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addGuideline = () => {
    if (guidelineInput.trim()) {
      setFormData(prev => ({
        ...prev,
        guidelines: [...(prev.guidelines || []), guidelineInput.trim()],
      }));
      setGuidelineInput('');
    }
  };

  const removeGuideline = (index: number) => {
    setFormData(prev => ({
      ...prev,
      guidelines: prev.guidelines?.filter((guideline: any, i: number) => i !== index),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Support Group</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="group-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                id="group-name-input"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Anxiety Support Circle"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="group-description-input" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="group-description-input"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the purpose and focus of your support group..."
                rows={3}
                required
                maxLength={500}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="group-category-select" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="group-category-select"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category...</option>
                <option value="anxiety">Anxiety</option>
                <option value="depression">Depression</option>
                <option value="trauma">Trauma & PTSD</option>
                <option value="addiction">Addiction Recovery</option>
                <option value="grief">Grief & Loss</option>
                <option value="relationships">Relationships</option>
                <option value="self-esteem">Self-Esteem</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">Privacy Settings</h3>
              
              <label htmlFor="private-group-checkbox" className="flex items-center space-x-3">
                <input
                  id="private-group-checkbox"
                  type="checkbox"
                  aria-label="Private Group"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Private Group</span>
                  <p className="text-xs text-gray-500">Only members can see posts and activities</p>
                </div>
              </label>

              <label htmlFor="require-approval-checkbox" className="flex items-center space-x-3">
                <input
                  id="require-approval-checkbox"
                  type="checkbox"
                  aria-label="Require Approval"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Require Approval</span>
                  <p className="text-xs text-gray-500">New members must be approved by moderators</p>
                </div>
              </label>
            </div>

            {/* Features */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900">Group Features</h3>
              
              <label htmlFor="allow-anonymous-checkbox" className="flex items-center space-x-3">
                <input
                  id="allow-anonymous-checkbox"
                  type="checkbox"
                  aria-label="Allow Anonymous Posts"
                  checked={formData.settings?.allowAnonymous}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings!, allowAnonymous: e.target.checked },
                  }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Allow Anonymous Posts</span>
                  <p className="text-xs text-gray-500">Members can post without revealing their identity</p>
                </div>
              </label>

              <label htmlFor="auto-moderation-checkbox" className="flex items-center space-x-3">
                <input
                  id="auto-moderation-checkbox"
                  type="checkbox"
                  aria-label="Auto-Moderation"
                  checked={formData.settings?.autoModeration}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings!, autoModeration: e.target.checked },
                  }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Auto-Moderation</span>
                  <p className="text-xs text-gray-500">Automatically filter harmful content</p>
                </div>
              </label>

              <label htmlFor="crisis-support-checkbox" className="flex items-center space-x-3">
                <input
                  id="crisis-support-checkbox"
                  type="checkbox"
                  aria-label="Crisis Support Integration"
                  checked={formData.settings?.crisisSupport}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings!, crisisSupport: e.target.checked },
                  }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Crisis Support Integration</span>
                  <p className="text-xs text-gray-500">Enable crisis detection and support features</p>
                </div>
              </label>

              <label htmlFor="peer-support-checkbox" className="flex items-center space-x-3">
                <input
                  id="peer-support-checkbox"
                  type="checkbox"
                  aria-label="Peer Support Program"
                  checked={formData.settings?.peerSupport}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    settings: { ...prev.settings!, peerSupport: e.target.checked },
                  }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Peer Support Matching</span>
                  <p className="text-xs text-gray-500">Connect members with similar experiences</p>
                </div>
              </label>
            </div>

            {/* Guidelines */}
            <div>
              <label htmlFor="guideline-input" className="block text-sm font-medium text-gray-700 mb-1">
                Community Guidelines
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  id="guideline-input"
                  type="text"
                  value={guidelineInput}
                  onChange={(e) => setGuidelineInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGuideline())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a guideline..."
                />
                <button
                  type="button"
                  onClick={addGuideline}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-1">
                {formData.guidelines?.map((guideline: any, index: number) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{guideline}</span>
                    <button
                      type="button"
                      onClick={() => removeGuideline(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
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
                {mutation.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function SupportGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch groups
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups', selectedCategory, searchQuery],
    queryFn: () => _communityService.getGroups({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
      limit: 12,
    }),
  });

  // Join group mutation
  const joinMutation = useMutation({
    mutationFn: (groupId: string) => _communityService.joinGroup(groupId),
    onSuccess: () => {
      toast.success('Successfully joined the group!');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: () => {
      toast.error('Failed to join group');
    },
  });

  // Leave group mutation
  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => _communityService.leaveGroup(groupId),
    onSuccess: () => {
      toast.success('You have left the group');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: () => {
      toast.error('Failed to leave group');
    },
  });

  const handleManageGroup = (group: SupportGroup) => {
    // Navigate to group management page
    window.location.href = `/community/groups/${group.id}/manage`;
  };

  const categories = [
    { value: 'all', label: 'All Groups', icon: Globe },
    { value: 'anxiety', label: 'Anxiety', icon: Heart },
    { value: 'depression', label: 'Depression', icon: Heart },
    { value: 'trauma', label: 'Trauma', icon: Shield },
    { value: 'addiction', label: 'Addiction', icon: Heart },
    { value: 'grief', label: 'Grief', icon: Heart },
    { value: 'relationships', label: 'Relationships', icon: Users },
    { value: 'self-esteem', label: 'Self-Esteem', icon: TrendingUp },
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
        <p className="text-red-600">Failed to load support groups. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Support Groups</h2>
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Create Group</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.groups && data.groups.length > 0 ? (
          data.groups.map((group: any) => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={joinMutation.mutate}
              onLeave={leaveMutation.mutate}
              onManage={handleManageGroup}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No groups found. Create one to get started!</p>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}