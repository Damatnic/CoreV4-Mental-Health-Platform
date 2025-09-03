/**
 * High-Performance Virtualized List Component
 * Optimized for mental health community posts and large datasets
 */

import React, { useCallback, useRef, useMemo, memo, CSSProperties } from 'react';
import { List as List, VList as VList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import { useInView } from 'react-intersection-observer';
import { performanceMonitor } from '../../utils/performance/performanceMonitor';
import { LoadingFallbacks } from '../../utils/performance/concurrentFeatures';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  itemHeight?: number | ((index: number) => number);
  height?: number;
  width?: string | number;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  emptyComponent?: React.ReactNode;
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  className?: string;
  estimatedItemSize?: number;
  getItemKey?: (index: number, data: T[]) => string;
}

/**
 * Optimized virtualized list with mental health app specific features
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 150,
  height = 600,
  width = '100%',
  overscan = 3,
  onEndReached,
  endReachedThreshold = 0.8,
  loading = false,
  emptyComponent,
  headerComponent,
  footerComponent,
  className = '',
  estimatedItemSize = 150,
  getItemKey,
}: VirtualizedListProps<T>) {
  const listRef = useRef<unknown>(null);
  const [isNearEnd, setIsNearEnd] = React.useState(false);
  const __lastScrollTop   = useRef(0);
  const scrollFrameId = useRef<number>();

  // Performance monitoring
  React.useEffect(() => {
    performanceMonitor.measureStart('virtualized-list-mount');
    return () => {
      performanceMonitor.measureEnd('virtualized-list-mount');
    };
  }, []);

  // Determine if we should use fixed or variable size list
  const isVariableHeight = typeof itemHeight === 'function';

  // Memoized item renderer
  const ItemRenderer = memo(({ index, style, data }: ListChildComponentProps<T[]>) => {
    const item = data[index];
    
    // Add intersection observer for lazy loading images
    const { ref, inView } = useInView({
      threshold: 0,
      triggerOnce: true,
      rootMargin: '50px',
    });

    return (
      <div ref={ref} style={style} className="px-4">
        {inView && item ? renderItem(item, index, style) : <LoadingFallbacks.Skeleton lines={3} />}
      </div>
    );
  });

  ItemRenderer.displayName = 'ItemRenderer';

  // Handle scroll with throttling for performance
  const __handleScroll   = useCallback(({ scrollOffset, _scrollDirection }: unknown) => {
    // Cancel previous frame
    if (scrollFrameId.current) {
      cancelAnimationFrame(scrollFrameId.current);
    }

    scrollFrameId.current = requestAnimationFrame(() => {
      const scrollTop = scrollOffset;
      const scrollHeight = listRef.current?.props?.height || height;
      const totalHeight = isVariableHeight
        ? items.length * estimatedItemSize
        : items.length * (itemHeight as number);

      const scrollPercentage = (scrollTop + scrollHeight) / totalHeight;

      // Check if near end
      if (scrollPercentage > endReachedThreshold && !isNearEnd && onEndReached) {
        setIsNearEnd(true);
        performanceMonitor.measureStart('infinite-scroll-load');
        onEndReached();
        
        // Reset after delay to allow new loads
        setTimeout(() => {
          setIsNearEnd(false);
          performanceMonitor.measureEnd('infinite-scroll-load');
        }, 1000);
      }

      lastScrollTop.current = scrollTop;
    });
  }, [items.length, isNearEnd, onEndReached, endReachedThreshold, height, itemHeight, isVariableHeight, estimatedItemSize]);

  // Get item size for variable height list
  const __getItemSize   = useMemo(() => {
    if (isVariableHeight) {
      return itemHeight as (index: number) => number;
    }
    return (index: number) => itemHeight as number;
  }, [itemHeight, isVariableHeight]);

  // Custom item key for better performance
  const itemKey = useCallback((index: number, data: T[]) => {
    if (_getItemKey) {
      return getItemKey(index, data);
    }
    // Use a stable key based on item properties if possible
    const item = data[index] as unknown;
    return item?.id || item?.key || `item-${index}`;
  }, [getItemKey]);

  // Empty state
  if (!loading && items.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const ListComponent = isVariableHeight ? VList : List;

  return (
    <div className={`virtualized-list-container ${className}`}>
      {headerComponent}
      
      {items.length > 0 && (
        <ListComponent
          ref={listRef}
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={isVariableHeight ? getItemSize : (typeof itemHeight === 'number' ? () => itemHeight : itemHeight)}
          overscanCount={overscan}
          onScroll={handleScroll}
          itemData={items}
          itemKey={itemKey}
          estimatedItemSize={estimatedItemSize}
          className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        >
          {ItemRenderer}
        </ListComponent>
      )}

      {loading && (
        <div className="py-4">
          <LoadingFallbacks.List items={3} />
        </div>
      )}

      {footerComponent}
    </div>
  );
}

/**
 * Optimized post list item component
 */
export const VirtualizedPostItem = memo(
({ 
  post, 
  style,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReport,
  isOwner,
}: unknown) => {
  // Defer non-critical updates
  const [showActions, setShowActions] = React.useState(false);
  
  React.useEffect(() => {
    // Lazy load action buttons
    const _timer = setTimeout(() => setShowActions(true), 100);
    return () => clearTimeout(_timer);
  }, []);

  return (
    <div style={style} className="virtualized-post-item">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
        {/* Post header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {post.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{post.username}</p>
              <p className="text-xs text-gray-500">{post.timeAgo}</p>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center space-x-1">
              {isOwner ? (
                <>
                  <button onClick={() => onEdit(_post)} className="p-1 text-gray-400 hover:text-blue-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => onDelete(post.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <button onClick={() => onReport(post.id)} className="p-1 text-gray-400 hover:text-orange-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Post content */}
        <div className="mb-3">
          <h4 className="text-base font-semibold text-gray-900 mb-1">{post.title}</h4>
          <p className="text-sm text-gray-700 line-clamp-3">{post.content}</p>
        </div>

        {/* Post stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => onLike(post.id)}
              className={`flex items-center space-x-1 text-sm ${post.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
            >
              <svg className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes}</span>
            </button>
            
            <button 
              onClick={() => onComment(post.id)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comments}</span>
            </button>
            
            <button 
              onClick={() => onShare(post.id)}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464 0m5.464 0a3 3 0 10-5.464 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{post.shares}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VirtualizedPostItem.displayName = 'VirtualizedPostItem';

/**
 * Auto-sizing text area with virtualization support
 */
export const VirtualizedTextArea = memo(({ 
  value, 
  onChange, 
  placeholder,
  maxLength = 5000,
  className = '',
}: unknown) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          adjustHeight();
        }}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full resize-none overflow-hidden ${className}`}
        rows={1}
      />
      <span className="absolute bottom-2 right-2 text-xs text-gray-400">
        {value.length}/{maxLength}
      </span>
    </div>
  );
});

VirtualizedTextArea.displayName = 'VirtualizedTextArea';