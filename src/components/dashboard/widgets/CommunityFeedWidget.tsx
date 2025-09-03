import React, { useEffect, useState } from 'react';
import { Users, MessageCircle, Heart, UserPlus, _Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeSync, RealtimeEvent } from '../../../services/integration/RealtimeSyncService';

interface CommunityPost {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isAnonymous: boolean;
}

interface CommunityFeedWidgetProps {
  isConnected: boolean;
  error?: string;
}

export function CommunityFeedWidget({ isConnected, error }: CommunityFeedWidgetProps) {
  const navigate = useNavigate();
  const realtimeSync = useRealtimeSync();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [__onlineUsers, setOnlineUsers] = useState(0);
  const [typingUsers, _setTypingUsers] = useState<string[]>([]);
  const [_loading, _setLoading] = useState(true);

  useEffect(() => {
    // Load initial posts
    loadPosts();

    // Subscribe to real-time updates
    const unsubPost = realtimeSync.on(RealtimeEvent.COMMUNITY_POST_CREATED, (_post) => {
      setPosts(prev => [post, ...prev].slice(0, 5));
    });

    const unsubComment = realtimeSync.on(RealtimeEvent.COMMUNITY_COMMENT_ADDED, (data) => {
      setPosts(prev => prev.map(post => 
        post.id === data.postId 
          ? { ...post, comments: post.comments + 1 }
          : post
      ));
    });

    const unsubUserJoined = realtimeSync.on(RealtimeEvent.COMMUNITY_USER_JOINED, () => {
      setOnlineUsers(prev => prev + 1);
    });

    const unsubUserLeft = realtimeSync.on(RealtimeEvent.COMMUNITY_USER_LEFT, () => {
      setOnlineUsers(prev => Math.max(0, prev - 1));
    });

    const unsubTyping = realtimeSync.on(RealtimeEvent.COMMUNITY_TYPING, (data) => {
      setTypingUsers(data.users);
    });

    return () => {
      unsubPost();
      unsubComment();
      unsubUserJoined();
      unsubUserLeft();
      unsubTyping();
    };
  }, [realtimeSync]);

  const loadPosts = async () => {
    // Mock data for demonstration
    const _mockPosts: CommunityPost[] = [
      {
        id: '1',
        author: 'Alex',
        content: 'Just completed my third meditation session this week! Feeling more centered.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        likes: 12,
        comments: 3,
        isAnonymous: false
      },
      {
        id: '2',
        author: 'Anonymous',
        content: 'Had a rough day but my safety plan really helped. Grateful for this community.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        likes: 24,
        comments: 8,
        isAnonymous: true
      },
      {
        id: '3',
        author: 'Jordan',
        content: 'Anyone joining the evening support group? Looking forward to seeing familiar faces.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        likes: 8,
        comments: 5,
        isAnonymous: false
      }
    ];

    setPosts(_mockPosts);
    setOnlineUsers(Math.floor(Math.random() * 50) + 10);
    setLoading(false);
  };

  if (_error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (_loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-16 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-3">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-700">
            {isConnected ? `${onlineUsers} members online` : 'Offline mode'}
          </span>
        </div>
        <button
          onClick={() => navigate('/community')}
          className="text-xs text-primary-600 hover:text-primary-700"
        >
          View All
        </button>
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-500 italic"
          >
            {typingUsers.slice(0, 2).join(', ')}
            {typingUsers.length > 2 && ` and ${typingUsers.length - 2} others`}
            {' are typing...'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts Feed */}
      <div className="space-y-2">
        {posts.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No recent posts</p>
            <button
              onClick={() => navigate('/community')}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700"
            >
              Join the conversation
            </button>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/community/post/${post.id}`)}
            >
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0">
                  {post.isAnonymous ? (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <Lock className="h-4 w-4 text-gray-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {post.author?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {post.isAnonymous ? 'Anonymous' : post.author}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatTime(post.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary-600">
                      <Heart className="h-3 w-3" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-primary-600">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Join Community CTA */}
      {!isConnected && (
        <button
          onClick={() => navigate('/community')}
          className="w-full bg-primary-100 text-primary-700 rounded-lg p-3 flex items-center justify-center hover:bg-primary-200 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Join Community</span>
        </button>
      )}
    </div>
  );
}