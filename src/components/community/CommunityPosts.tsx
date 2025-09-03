import React, { useState, useEffect, _useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Flag, Edit2, Trash2, AlertTriangle, Award, Users, TrendingUp } from 'lucide-react';
import { _format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { communityService, Post, CreatePostDto } from '../../services/community/communityService';
import { websocketService } from '../../services/realtime/websocketService';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (_postId: string) => void;
  onReport: (_postId: string) => void;
}

function PostCard({ post, onEdit, onDelete, onReport }: PostCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const likeMutation = useMutation({
    mutationFn: () => isLiked ? communityService.unlikePost(post.id) : communityService.likePost(post.id),
    onSuccess: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      toast._error('Failed to update like status');
    },
  });

  const shareMutation = useMutation({
    mutationFn: () => communityService.sharePost(post.id),
    onSuccess: () => {
      toast.success('Post shared successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = () => {
    shareMutation.mutate();
  };

  const isOwner = user?.id === post.userId;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Trigger Warning */}
      {post.triggerWarning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Content Warning</p>
            <p className="text-xs text-yellow-600 mt-1">
              This post contains content related to: {post.triggerWarningType?.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {post.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{post.username}</h4>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {post.metadata?.mood && (
                <span className="ml-2 text-blue-600">Feeling {post.metadata.mood}</span>
              )}
            </p>
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center space-x-1">
          {isOwner && (
            <>
              <button
                onClick={() => onEdit(post)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Edit post"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          {!isOwner && (
            <button
              onClick={() => onReport(post.id)}
              className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
              aria-label="Report post"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Helpful Votes Badge */}
      {post.metadata?.helpfulVotes && post.metadata.helpfulVotes > 5 && (
        <div className="flex items-center space-x-1 mb-4 text-green-600">
          <Award className="h-4 w-4" />
          <span className="text-sm font-medium">
            {post.metadata.helpfulVotes} people found this helpful
          </span>
        </div>
      )}

      {/* Interaction Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
            }`}
            disabled={likeMutation.isPending}
          >
            <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.comments}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-600 transition-colors"
            disabled={shareMutation.isPending}
          >
            <Share2 className="h-5 w-5" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>

        {/* Post Visibility */}
        <span className="text-xs text-gray-400">
          {post.visibility === 'public' ? 'Public' : post.visibility === 'group' ? 'Group Only' : 'Private'}
        </span>
      </div>

      {/* Comments Section (placeholder for now) */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">Comments coming soon...</p>
        </div>
      )}
    </div>
  );
}

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPost?: Post | null;
  groupId?: string;
}

function CreatePostModal({ isOpen, onClose, editPost, groupId }: CreatePostModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreatePostDto>({
    title: editPost?.title || '',
    content: editPost?.content || '',
    tags: editPost?.tags || [],
    triggerWarning: editPost?.triggerWarning || false,
    triggerWarningType: editPost?.triggerWarningType || [],
    visibility: editPost?.visibility || 'public',
    mood: editPost?.metadata?.mood || '',
    groupId,
  });
  const [tagInput, setTagInput] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CreatePostDto) => 
      editPost 
        ? communityService.updatePost(editPost.id, data)
        : communityService.createPost(data),
    onSuccess: () => {
      toast.success(editPost ? 'Post updated successfully' : 'Post created successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onClose();
    },
    onError: (_error: unknown) => {
      toast._error(_error.message || 'Failed to save post');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const triggerWarningTypes = [
    'Self-harm', 'Suicide', 'Eating disorders', 'Substance abuse',
    'Violence', 'Trauma', 'Abuse', 'Death', 'Medical content'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Give your post a title..."
                required
                maxLength={200}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Share your thoughts, experiences, or ask for support..."
                rows={6}
                required
                maxLength={5000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/5000 characters
              </p>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Mood (_optional)
              </label>
              <select
                value={formData.mood}
                onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select mood...</option>
                <option value="happy">Happy</option>
                <option value="grateful">Grateful</option>
                <option value="hopeful">Hopeful</option>
                <option value="anxious">Anxious</option>
                <option value="sad">Sad</option>
                <option value="frustrated">Frustrated</option>
                <option value="overwhelmed">Overwhelmed</option>
                <option value="confused">Confused</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tags..."
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

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as unknown }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="group">Group - Only group members</option>
                <option value="private">Private - Only you</option>
              </select>
            </div>

            {/* Trigger Warning */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.triggerWarning}
                  onChange={(e) => setFormData(prev => ({ ...prev, triggerWarning: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  This post contains sensitive content
                </span>
              </label>

              {formData.triggerWarning && (
                <div className="ml-6 space-y-2">
                  <p className="text-xs text-gray-600">Select content types:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {triggerWarningTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.triggerWarningType?.includes(type) || false}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                triggerWarningType: [...(prev.triggerWarningType || []), type],
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                triggerWarningType: prev.triggerWarningType?.filter(t => t !== type),
                              }));
                            }
                          }}
                          className="h-3 w-3 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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
                {mutation.isPending ? 'Saving...' : editPost ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function CommunityPosts({ groupId }: { groupId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'recent' | 'popular' | 'helpful'>('recent');

  // Fetch posts
  const { data, _isLoading, _error } = useQuery({
    queryKey: ['posts', groupId, selectedFilter],
    queryFn: () => communityService.getPosts({ groupId, limit: 20 }),
  });

  // Delete post mutation
  const deleteMutation = useMutation({
    mutationFn: (_postId: string) => communityService.deletePost(_postId),
    onSuccess: () => {
      toast.success('Post deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      toast._error('Failed to delete post');
    },
  });

  // Report post mutation
  const reportMutation = useMutation({
    mutationFn: ({ _postId, reason }: { _postId: string; reason: string }) => 
      communityService.reportPost(_postId, reason),
    onSuccess: () => {
      toast.success('Post reported. Our moderation team will review it.');
    },
    onError: () => {
      toast._error('Failed to report post');
    },
  });

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    const handleNewPost = (_post: Post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('New post in the community!');
    };

    const handlePostUpdate = (_post: Post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    };

    const handlePostDelete = (_postId: string) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    };

    websocketService.on('post:new', handleNewPost);
    websocketService.on('post:update', handlePostUpdate);
    websocketService.on('post:delete', handlePostDelete);

    return () => {
      websocketService.off('post:new', handleNewPost);
      websocketService.off('post:update', handlePostUpdate);
      websocketService.off('post:delete', handlePostDelete);
    };
  }, [queryClient]);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowCreateModal(true);
  };

  const handleDelete = (_postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(_postId);
    }
  };

  const handleReport = (_postId: string) => {
    const reason = prompt('Please provide a reason for reporting this post:');
    if (reason) {
      reportMutation.mutate({ _postId, reason });
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPost(null);
  };

  if (_isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (_error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load posts. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Community Posts</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedFilter('recent')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'recent'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSelectedFilter('popular')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'popular'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Popular
            </button>
            <button
              onClick={() => setSelectedFilter('helpful')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'helpful'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Award className="inline h-3 w-3 mr-1" />
              Most Helpful
            </button>
          </div>
        </div>
        
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>Create Post</span>
          </button>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {data?.posts && data.posts.length > 0 ? (
          data.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReport={handleReport}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>

      {/* Create/Edit Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        editPost={editingPost}
        groupId={groupId}
      />
    </div>
  );
}