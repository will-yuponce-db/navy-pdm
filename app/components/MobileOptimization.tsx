import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Fab, SwipeableDrawer, Typography, useTheme } from '@mui/material';

// Touch gesture detection
export class TouchGestureDetector {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private threshold = 50;
  private timeThreshold = 300;

  getStartY(): number {
    return this.startY;
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }

  onTouchEnd(event: TouchEvent, callbacks: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onTap?: () => void;
    onLongPress?: () => void;
  }): void {
    const touch = event.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine gesture type
    if (deltaTime > this.timeThreshold && absX < this.threshold && absY < this.threshold) {
      // Long press
      callbacks.onLongPress?.();
    } else if (absX > absY && absX > this.threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    } else if (absY > absX && absY > this.threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        callbacks.onSwipeDown?.();
      } else {
        callbacks.onSwipeUp?.();
      }
    } else if (absX < this.threshold && absY < this.threshold && deltaTime < this.timeThreshold) {
      // Tap
      callbacks.onTap?.();
    }
  }
}

// Mobile-optimized navigation component
export const MobileNavigation: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactNode;
}> = ({ isOpen, onClose, onOpen, children }) => {
  const theme = useTheme();
  const gestureDetector = useRef(new TouchGestureDetector());

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    gestureDetector.current.onTouchStart(event.nativeEvent);
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    gestureDetector.current.onTouchEnd(event.nativeEvent, {
      onSwipeLeft: () => {
        if (isOpen) onClose();
      },
      onSwipeRight: () => {
        if (!isOpen) onOpen();
      },
    });
  }, [isOpen, onClose, onOpen]);

  return (
    <SwipeableDrawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      swipeAreaWidth={20}
      disableSwipeToOpen={false}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        sx: {
          width: { xs: '85%', sm: '300px' },
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </Box>
    </SwipeableDrawer>
  );
};

// Touch-optimized floating action button
export const TouchFAB: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: { bottom: number; right: number };
  size?: 'small' | 'medium' | 'large';
}> = ({ onClick, icon, label, position = { bottom: 16, right: 16 }, size = 'large' }) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    onClick();
  }, [onClick]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  return (
    <Fab
      size={size}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      sx={{
        position: 'fixed',
        bottom: position.bottom,
        right: position.right,
        zIndex: 1000,
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease-in-out',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
      aria-label={label}
    >
      {icon}
    </Fab>
  );
};

// Mobile-optimized table with touch gestures
export const MobileTable: React.FC<{
  data: Record<string, unknown>[];
  columns: Array<{ key: string; label: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }>;
  onRowClick?: (row: Record<string, unknown>) => void;
  onSwipeLeft?: (row: Record<string, unknown>) => void;
  onSwipeRight?: (row: Record<string, unknown>) => void;
}> = ({ data, columns, onRowClick, onSwipeLeft, onSwipeRight }) => {
  const gestureDetector = useRef(new TouchGestureDetector());
  const [swipedRow, setSwipedRow] = useState<string | null>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    gestureDetector.current.onTouchStart(event.nativeEvent);
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent, row: Record<string, unknown>) => {
    gestureDetector.current.onTouchEnd(event.nativeEvent, {
      onTap: () => onRowClick?.(row),
      onSwipeLeft: () => {
        setSwipedRow(row.id);
        onSwipeLeft?.(row);
      },
      onSwipeRight: () => {
        setSwipedRow(row.id);
        onSwipeRight?.(row);
      },
    });
  }, [onRowClick, onSwipeLeft, onSwipeRight]);

  return (
    <Box sx={{ width: '100%' }}>
      {data.map((row, index) => (
        <Box
          key={row.id || index}
          onTouchStart={(e) => handleTouchStart(e, row.id)}
          onTouchEnd={(e) => handleTouchEnd(e, row)}
          sx={{
            p: 2,
            mb: 1,
            backgroundColor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            touchAction: 'pan-y',
            WebkitTapHighlightColor: 'transparent',
            transform: swipedRow === row.id ? 'translateX(-50px)' : 'translateX(0)',
            transition: 'transform 0.2s ease-in-out',
            '&:active': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {columns.map((column) => (
            <Box key={column.key} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {column.label}
              </Typography>
              <Typography variant="body2">
                {column.render ? column.render(row[column.key], row) : row[column.key]}
              </Typography>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

// Mobile-optimized search with haptic feedback
export const MobileSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
}> = ({ value, onChange, placeholder = 'Search...', onSearch }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = useCallback(() => {
    if (onSearch) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onSearch(value);
    }
  }, [onSearch, value]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        mb: 2,
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          fontSize: '16px', // Prevents zoom on iOS
          border: '1px solid #ccc',
          borderRadius: '8px',
          outline: 'none',
          backgroundColor: '#fff',
          boxSizing: 'border-box',
        }}
      />
      {isFocused && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            mt: 1,
            p: 1,
            zIndex: 1000,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Press Enter to search
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Mobile-optimized modal with touch gestures
export const MobileModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullScreen?: boolean;
}> = ({ open, onClose, title, children, fullScreen = false }) => {
  const gestureDetector = useRef(new TouchGestureDetector());
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    gestureDetector.current.onTouchStart(event.nativeEvent);
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const deltaY = touch.clientY - gestureDetector.current.getStartY();
    
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - gestureDetector.current.getStartY();
    
    if (deltaY > 100) {
      onClose();
    } else {
      setDragOffset(0);
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <Box
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: '100%',
          maxWidth: fullScreen ? '100%' : '500px',
          height: fullScreen ? '100%' : 'auto',
          maxHeight: fullScreen ? '100%' : '80vh',
          backgroundColor: 'background.paper',
          borderRadius: fullScreen ? 0 : '16px 16px 0 0',
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? 'transform 0.3s ease-out' : 'none',
          touchAction: 'pan-y',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <Box
          sx={{
            width: '40px',
            height: '4px',
            backgroundColor: 'text.disabled',
            borderRadius: '2px',
            mx: 'auto',
            mt: 1,
            mb: 2,
          }}
        />
        
        {title && (
          <Typography
            variant="h6"
            sx={{
              px: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {title}
          </Typography>
        )}
        
        <Box sx={{ p: 2, overflow: 'auto', height: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Mobile-optimized infinite scroll
export const MobileInfiniteScroll: React.FC<{
  children: React.ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  threshold?: number;
}> = ({ children, hasMore, loadMore }) => {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          loadMore();
          setTimeout(() => setIsLoading(false), 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return (
    <Box>
      {children}
      {hasMore && (
        <Box
          ref={loadMoreRef}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 2,
          }}
        >
          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading more...
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Pull to load more
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// Mobile-optimized pull-to-refresh
export const MobilePullToRefresh: React.FC<{
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}> = ({ onRefresh, children, threshold = 80 }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(event.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isPulling) return;

    const currentY = event.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      event.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, startY, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling && pullDistance >= threshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    setIsPulling(false);
  }, [isPulling, pullDistance, threshold, onRefresh]);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        position: 'relative',
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '50px',
          }}
        >
          {isRefreshing ? (
            <Typography variant="body2">Refreshing...</Typography>
          ) : pullDistance >= threshold ? (
            <Typography variant="body2">Release to refresh</Typography>
          ) : (
            <Typography variant="body2">Pull to refresh</Typography>
          )}
        </Box>
      )}
      
      {children}
    </Box>
  );
};

// Mobile-optimized keyboard handling
export const useMobileKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const initialHeight = window.innerHeight;
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;

      if (heightDifference > 150) {
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDifference);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};
