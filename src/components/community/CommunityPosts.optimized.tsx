/**
 * Optimized Community Posts Component
 * High-performance implementation with virtualization and React 18/19 features
 */

import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Flag, Edit2, Trash2, AlertTriangle, Award, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { communityService, Post, CreatePostDto } from '../../services/community/communityService';
import { websocketService } from '../../services/realtime/websocketService';
import { useAuth } from '../../hooks/useAuth';
import { 
  VirtualizedList, 
  VirtualizedPostItem 
} from '../performance/VirtualizedList';
import {
  usePrioritizedTransition,
  usePrioritizedDeferredValue,
  LoadingFallbacks,
  UpdatePriority,
  SuspenseWrapper,
  optimizedMemo,
  ProgressiveEnhancement,
} from '../../utils/performance/concurrentFeatures';
import {
  useResourceCleanup,
  throttleWithCleanup,
  debounceWithCleanup,
} from '../../utils/performance/memoryManagement';
import { performanceMonitor } from '../../utils/performance/performanceMonitor';

/**
 * Optimized Create/Edit Post Modal
 */
const CreatePostModal = optimizedMemo<any>(({ 
  isOpen, 
  onClose, 
  editPost, 
  groupId 
}: {
  isOpen: boolean;
  onClose: () => void;
  editPost?: Post | null;
  groupId?: string;
}) => {
  const queryClient = useQueryClient();
  const [isPending, startPrioritizedTransition] = usePrioritizedTransition(UpdatePriority.HIGH);
  
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
  
  const mutation = useMutation({
    mutationFn: (data: CreatePostDto) => 
      editPost 
        ? communityService.updatePost(editPost.id, data)
        : communityService.createPost(data),
    onSuccess: () => {
      toast.success(editPost ? 'Post updated' : 'Post created');
      startPrioritizedTransition(() => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save post');
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performanceMonitor.measureStart('post-submit');
    mutation.mutate(formData);
    performanceMonitor.measureEnd('post-submit');
  }, [formData, mutation]);

  // Debounced content update for better performance
  const updateContent = useMemo(
    () => debounceWithCleanup((content: string) => {
      startPrioritizedTransition(() => {
        setFormData(prev => ({ ...prev, content }));
      });
    }, 300),
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editPost ? 'Edit Post' : 'Create New Post'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                defaultValue={formData.content}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={6}
                required
                maxLength={5000}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving...' : editPost ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

/**
 * Main Optimized Community Posts Component
 */
export function OptimizedCommunityPosts({ groupId }: { groupId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const componentId = 'community-posts';
  
  // Resource cleanup management
  const { registerEventListener, registerInterval } = useResourceCleanup(componentId);
  
  // State management with deferred values
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'recent' | 'popular' | 'helpful'>('recent');
  const [localPosts, setLocalPosts] = useState<Post[]>([]);
  
  // Use deferred value for filter to prevent blocking UI
  const deferredFilter = usePrioritizedDeferredValue(selectedFilter, UpdatePriority.LOW);
  const [isPending, startPrioritizedTransition] = usePrioritizedTransition(UpdatePriority.MEDIUM);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.measureStart('community-posts-mount');
    return () => {
      performanceMonitor.measureEnd('community-posts-mount');
    };
  }, []);

  // Fetch posts with optimized query
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['posts', groupId, deferredFilter],
    queryFn: () => communityService.getPosts({ 
      groupId, 
      limit: 50, // Fetch more for virtualization
      filter: deferredFilter 
    }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update local posts when data changes
  useEffect(() => {
    if (data?.posts) {
      startPrioritizedTransition(() => {
        setLocalPosts(data.posts);
      });
    }
  }, [data]);

  // Optimized delete mutation
  const deleteMutation = useMutation({
    mutationFn: (postId: string) => communityService.deletePost(postId),
    onMutate: async (postId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      const previousPosts = queryClient.getQueryData(['posts', groupId, deferredFilter]);
      
      startPrioritizedTransition(() => {
        setLocalPosts(prev => prev.filter(p => p.id !== postId));
      });
      
      return { previousPosts };
    },
    onError: (err, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts', groupId, deferredFilter], context.previousPosts);
      }
      toast.error('Failed to delete post');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // WebSocket listeners with cleanup
  useEffect(() => {
    const handleNewPost = throttleWithCleanup((post: Post) => {
      startPrioritizedTransition(() => {
        setLocalPosts(prev => [post, ...prev]);
        toast.success('New post in the community!');
      });
    }, 1000);

    const handlePostUpdate = throttleWithCleanup((post: Post) => {
      startPrioritizedTransition(() => {
        setLocalPosts(prev => prev.map(p => p.id === post.id ? post : p));
      });
    }, 500);

    const handlePostDelete = (postId: string) => {
      startPrioritizedTransition(() => {
        setLocalPosts(prev => prev.filter(p => p.id !== postId));
      });
    };

    websocketService.on('post:new', handleNewPost);
    websocketService.on('post:update', handlePostUpdate);
    websocketService.on('post:delete', handlePostDelete);

    return () => {
      websocketService.off('post:new', handleNewPost);
      websocketService.off('post:update', handlePostUpdate);
      websocketService.off('post:delete', handlePostDelete);
      handleNewPost.cancel();
      handlePostUpdate.cancel();
    };
  }, []);

  // Handlers
  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setShowCreateModal(true);
  }, []);

  const handleDelete = useCallback((postId: string) => {
    if (window.confirm('Delete this post?')) {
      deleteMutation.mutate(postId);
    }
  }, [deleteMutation]);

  const handleReport = useCallback((postId: string) => {
    const reason = prompt('Report reason:');
    if (reason) {
      communityService.reportPost(postId, reason);
      toast.success('Post reported');
    }
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const post = localPosts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    startPrioritizedTransition(() => {
      setLocalPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      ));
    });

    try {
      if (post.isLiked) {
        await communityService.unlikePost(postId);
      } else {
        await communityService.likePost(postId);
      }
    } catch (error) {
      // Rollback on error
      startPrioritizedTransition(() => {
        setLocalPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: post.isLiked, likes: post.likes }
            : p
        ));
      });
    }
  }, [localPosts]);

  // Prepare posts for virtualization
  const virtualizedPosts = useMemo(() => 
    localPosts.map(post => ({
      ...post,
      timeAgo: formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }),
      isOwner: user?.id === post.userId,
    })),
    [localPosts, user]
  );

  // Calculate dynamic item heights based on content
  const getItemHeight = useCallback((index: number) => {
    const post = virtualizedPosts[index];
    if (!post) return 150;
    
    // Base height + content-based calculation
    const baseHeight = 150;
    const contentLines = Math.ceil(post.content.length / 80);
    const additionalHeight = contentLines * 20;
    
    return Math.min(baseHeight + additionalHeight, 300);
  }, [virtualizedPosts]);

  // Infinite scroll handler
  const handleEndReached = useCallback(() => {
    if (!isFetching && data?.hasMore) {
      // Load more posts
      queryClient.fetchQuery({
        queryKey: ['posts', groupId, deferredFilter, data.nextCursor],
        queryFn: () => communityService.getPosts({ 
          groupId, 
          filter: deferredFilter,
          cursor: data.nextCursor 
        }),
      });
    }
  }, [isFetching, data, groupId, deferredFilter, queryClient]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Community</h2>
          <div className="flex items-center space-x-2">
            {(['recent', 'popular', 'helpful'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter === 'popular' && <TrendingUp className="inline h-3 w-3 mr-1" />}
                {filter === 'helpful' && <Award className="inline h-3 w-3 mr-1" />}
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {user && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit2 className="h-4 w-4" />
            <span>Create Post</span>
          </button>
        )}
      </div>

      {/* Virtualized Posts List */}
      <SuspenseWrapper fallback={<LoadingFallbacks.List items={5} />}>
        <ProgressiveEnhancement
          placeholder={<LoadingFallbacks.List items={3} />}
          priority={UpdatePriority.MEDIUM}
        >
          {isLoading ? (
            <LoadingFallbacks.List items={5} />
          ) : virtualizedPosts.length > 0 ? (
            <VirtualizedList
              items={virtualizedPosts}
              renderItem={(post, index, style) => (
                <VirtualizedPostItem
                  key={post.id}
                  post={post}
                  style={style}
                  onLike={handleLike}
                  onComment={() => toast('Comments coming soon', { icon: 'ℹ️' })}
                  onShare={() => toast('Sharing coming soon', { icon: 'ℹ️' })}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  isOwner={post.isOwner}
                />
              )}
              itemHeight={getItemHeight}
              height={600}
              overscan={5}
              onEndReached={handleEndReached}
              loading={isFetching}
              emptyComponent={
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No posts yet. Be the first to share!</p>
                </div>
              }
              className="community-posts-virtual"
              estimatedItemSize={200}
            />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No posts yet. Be the first to share!</p>
            </div>
          )}
        </ProgressiveEnhancement>
      </SuspenseWrapper>

      {/* Loading indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm text-gray-600">Updating...</span>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPost(null);
        }}
        editPost={editingPost}
        groupId={groupId}
      />
    </div>
  );
}