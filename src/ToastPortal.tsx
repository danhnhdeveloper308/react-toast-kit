import React, { useEffect, useState, memo, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from './toast';
import { AnimatePresence, motion } from 'framer-motion';
import type { Toast, ToastPosition, ToastAnimation, ToastStyle } from './toast';

/**
 * Finds the highest z-index in use in the document with caching
 */
const findHighestZIndex = (() => {
  let cachedZIndex: number | null = null;
  let lastCheck = 0;
  const CACHE_DURATION = 5000; // 5 seconds

  return (): number => {
    const now = Date.now();

    if (cachedZIndex !== null && (now - lastCheck) < CACHE_DURATION) {
      return cachedZIndex;
    }

    let highestZ = 9000;

    if (typeof window === 'undefined') return highestZ;

    try {
      const elements = document.getElementsByTagName('*');
      for (let i = 0; i < elements.length; i++) {
        const zIndex = parseInt(window.getComputedStyle(elements[i]).zIndex, 10);
        if (zIndex && zIndex > highestZ) {
          highestZ = zIndex;
        }
      }
    } catch (error) {
      console.warn('React Toast Kit: Failed to find highest z-index', error);
    }

    cachedZIndex = highestZ + 1;
    lastCheck = now;
    return cachedZIndex;
  };
})();

interface ToastPortalProps {
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  enableAccessibleAnnouncements?: boolean;
}

// Device breakpoints with enhanced detection
const DEVICE_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

const TOAST_WIDTHS = {
  mobile: 320,
  tablet: 360,
  desktop: 380,
};

// Enhanced SVG Icon component with better performance
const SVGIcon = memo(({
  svgString,
  className = ''
}: {
  svgString: string;
  className?: string;
}) => {
  const memoizedSVG = useMemo(() => ({ __html: svgString }), [svgString]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={memoizedSVG}
    />
  );
});

// Accessibility announcer component
const AccessibilityAnnouncer = memo(({ toasts }: { toasts: Toast[] }) => {
  const [announcement, setAnnouncement] = useState<string>('');
  const announcementRef = useRef<string>('');
  const lastToastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (toasts.length === 0) return;
    
    // Get the most recent toast
    const latestToast = toasts[0];
    
    // Skip if it's the same toast being announced
    if (latestToast.id === lastToastIdRef.current) return;
    
    // Create the announcement text
    let text = '';
    
    if (latestToast.variant) {
      text += `${latestToast.variant} notification: `;
    }
    
    if (latestToast.title) {
      text += latestToast.title;
      if (latestToast.description) {
        text += '. ';
      }
    }
    
    if (latestToast.description) {
      text += latestToast.description;
    }
    
    // Only announce if different from the last announcement
    if (text && text !== announcementRef.current) {
      announcementRef.current = text;
      lastToastIdRef.current = latestToast.id;
      setAnnouncement(text);
      
      // Clear announcement after a delay for screen readers to process
      setTimeout(() => {
        setAnnouncement('');
      }, 1000);
    }
  }, [toasts]);

  if (!announcement) return null;
  
  return (
    <div 
      aria-live="polite"
      aria-atomic="true" 
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
});

// Hook for swipe gesture detection
const useSwipeGesture = (
  enabled: boolean,
  onSwipe: () => void,
  threshold: number = 100
) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;
  }, [enabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Start swiping if horizontal movement is greater than vertical
    if (deltaX > deltaY && deltaX > 10) {
      isSwiping.current = true;
      e.preventDefault(); // Prevent scrolling
    }
  }, [enabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || !isSwiping.current) return;

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);

    if (deltaX > threshold) {
      onSwipe();
    }

    isSwiping.current = false;
  }, [enabled, onSwipe, threshold]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

// Enhanced ToastItem component with better memoization
const ToastItem = memo(({
  toast,
  onDismiss,
  onPause,
  onResume,
  animation,
  position,
  toastTheme,
  defaultStyle
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  animation: ToastAnimation;
  position: ToastPosition;
  toastTheme: 'light' | 'dark';
  defaultStyle: ToastStyle;
}) => {
  const toastRef = useRef<HTMLDivElement>(null);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDismiss = useCallback(() => {
    onDismiss(toast.id);
  }, [onDismiss, toast.id]);

  const handlePause = useCallback(() => {
    if (toast.pauseOnHover) onPause(toast.id);
  }, [onPause, toast.id, toast.pauseOnHover]);

  const handleResume = useCallback(() => {
    onResume(toast.id);
  }, [onResume, toast.id]);

  // Swipe gesture handlers
  const swipeGesture = useSwipeGesture(
    toast.swipeToDismiss || false,
    handleDismiss
  );

  // Enhanced ripple effect with better performance
  const handleRippleEffect = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (toast.rippleEffect && toastRef.current) {
      const toastElement = toastRef.current;
      const rect = toastElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create ripple element
      const ripple = document.createElement('div');
      ripple.className = 'toast-ripple-element';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      toastElement.appendChild(ripple);

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (toastElement.contains(ripple)) {
            toastElement.removeChild(ripple);
          }
        }, 700);
      });
    }

    if (toast.dismissOnClick) {
      handleDismiss();
    }
  }, [toast.rippleEffect, toast.dismissOnClick, handleDismiss]);

  // Memoize variant classes
  const variantClasses = useMemo(() => {
    const isDark = toastTheme === 'dark';

    switch (toast.variant) {
      case 'success':
        return isDark
          ? 'bg-green-700 text-white border border-green-600'
          : 'bg-green-500 text-white';
      case 'error':
        return isDark
          ? 'bg-red-700 text-white border border-red-600'
          : 'bg-red-500 text-white';
      case 'warning':
        return isDark
          ? 'bg-amber-700 text-white border border-amber-600'
          : 'bg-amber-500 text-white';
      case 'info':
        return isDark
          ? 'bg-blue-700 text-white border border-blue-600'
          : 'bg-blue-500 text-white';
      case 'loading':
        return isDark
          ? 'bg-gray-700 text-white border border-gray-600'
          : 'bg-gray-500 text-white';
      case 'custom':
        return '';
      default:
        return isDark
          ? 'bg-gray-800 text-white border border-gray-700'
          : 'bg-white text-gray-900 border border-gray-200';
    }
  }, [toast.variant, toastTheme]);

  // Memoize animation variants with custom animation support
  const animationVariants = useMemo(() => {
    // Use custom animation if provided
    if (toast.customAnimation) {
      return toast.customAnimation;
    }

    const animationType = toast.animation || animation;
    const toastPosition = toast.position || position;
    const isTop = toastPosition.startsWith('top');
    const isBottom = toastPosition.startsWith('bottom');
    const isLeft = toastPosition.endsWith('left');
    const isRight = toastPosition.endsWith('right');
    const isCenter = toastPosition.endsWith('center');

    if (animationType === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 }
      };
    }

    if (animationType === 'fade') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }

    if (animationType === 'bounce') {
      let initial = {};
      if (isTop) initial = { opacity: 0, y: -80, scale: 0.9 };
      else if (isBottom) initial = { opacity: 0, y: 80, scale: 0.9 };
      else if (isLeft) initial = { opacity: 0, x: -80, scale: 0.9 };
      else if (isRight) initial = { opacity: 0, x: 80, scale: 0.9 };

      return {
        initial,
        animate: {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 350,
            damping: 25
          }
        },
        exit: {
          opacity: 0,
          scale: 0.9,
          transition: { duration: 0.2 }
        }
      };
    }

    if (animationType === 'flip') {
      return {
        initial: {
          opacity: 0,
          rotateX: 90,
          perspective: 400
        },
        animate: {
          opacity: 1,
          rotateX: 0,
          perspective: 400,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25
          }
        },
        exit: {
          opacity: 0,
          rotateX: 90,
          perspective: 400,
          transition: { duration: 0.3 }
        }
      };
    }

    if (animationType === 'zoom') {
      return {
        initial: { opacity: 0, scale: 0.5 },
        animate: {
          opacity: 1,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 30
          }
        },
        exit: {
          opacity: 0,
          scale: 0.5,
          transition: { duration: 0.2 }
        }
      };
    }

    // Default slide animation
    let initial = {};
    let exit = {};

    if (isTop) {
      initial = { opacity: 0, y: -20 };
      exit = { opacity: 0, y: -20 };
    } else if (isBottom) {
      initial = { opacity: 0, y: 20 };
      exit = { opacity: 0, y: 20 };
    } else if (isLeft) {
      initial = { opacity: 0, x: -20 };
      exit = { opacity: 0, x: -20 };
    } else if (isRight) {
      initial = { opacity: 0, x: 20 };
      exit = { opacity: 0, x: 20 };
    } else if (isCenter) {
      if (isTop) {
        initial = { opacity: 0, y: -20 };
        exit = { opacity: 0, y: -20 };
      } else {
        initial = { opacity: 0, y: 20 };
        exit = { opacity: 0, y: 20 };
      }
    }

    return {
      initial,
      animate: { opacity: 1, y: 0, x: 0 },
      exit
    };
  }, [toast.customAnimation, toast.animation, animation, toast.position, position]);

  // Memoize additional classes
  const additionalClasses = useMemo(() => {
    const classes: string[] = [];

    if (toast.floating) classes.push('react-toast-floating');
    if (toast.rippleEffect) classes.push('toast-ripple');

    const visualStyle = toast.visualStyle || defaultStyle;
    if (visualStyle === 'glass' || visualStyle === 'gradient') {
      classes.push('toast-soft-shadow');
    }

    return classes.join(' ');
  }, [toast.floating, toast.rippleEffect, toast.visualStyle, defaultStyle]);

  // Memoize icon color
  const iconColor = useMemo(() => {
    if (toast.variant === 'custom') return '';

    if (!toast.variant || toast.variant === 'default') {
      return toastTheme === 'dark' ? 'text-gray-300' : 'text-gray-500';
    }

    return 'text-white';
  }, [toast.variant, toastTheme]);

  // Memoize progress bar classes
  const progressBarClasses = useMemo(() => {
    const baseClass = 'react-toast-progress';
    
    // Return the style class based on the progress bar style
    if (toast.progressBarStyle) {
      return `${baseClass} ${toast.progressBarStyle}`;
    }

    if (toast.variant === 'custom') return `${baseClass} bg-white/20`;

    if (!toast.variant || toast.variant === 'default') {
      return toastTheme === 'dark'
        ? `${baseClass} bg-gray-600`
        : `${baseClass} bg-gray-300`;
    }

    return `${baseClass} bg-white/30`;
  }, [toast.progressBarStyle, toast.variant, toastTheme]);

  // Memoize close button classes
  const closeButtonClasses = useMemo(() => {
    if (toast.variant === 'custom') return '';

    if (!toast.variant || toast.variant === 'default') {
      return toastTheme === 'dark'
        ? 'bg-gray-700 text-gray-300 hover:text-white'
        : 'bg-gray-200 text-gray-600 hover:text-gray-800';
    }

    return 'bg-white/25 backdrop-blur-sm text-white/90 hover:bg-white/35 hover:text-white';
  }, [toast.variant, toastTheme]);

  // Memoize emoji component
  const emojiComponent = useMemo(() => {
    if (!toast.emoji) return null;

    return (
      <div className="flex-shrink-0 mr-3 toast-emoji">
        {toast.emoji}
      </div>
    );
  }, [toast.emoji]);

  // Get icon string
  const iconString = (toast as any).iconString;

  return (
    <motion.div
      key={toast.id}
      className="react-toast-item w-full"
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={{
        duration: (toast as any).updating ? 0.1 : 0.2,
        ...animationVariants.transition
      }}
      layout
    >
      <div
        ref={toastRef}
        role={toast.variant === 'error' ? 'alert' : 'status'}
        aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
        className={`relative overflow-hidden shadow-lg rounded-lg ${variantClasses} ${toast.className || ''} ${additionalClasses} react-toast w-full`}
        style={toast.style}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onClick={handleRippleEffect}
        onTouchStart={swipeGesture.handleTouchStart}
        onTouchMove={swipeGesture.handleTouchMove}
        onTouchEnd={swipeGesture.handleTouchEnd}
        data-variant={toast.variant}
        data-theme={toastTheme}
        data-style={toast.visualStyle || defaultStyle}
        data-progress-position={toast.progressBarPosition || 'bottom'}
        data-testid={`toast-${toast.id}`}
        tabIndex={0}
      >
        {/* Progress indicator for timed toasts */}
        {toast.duration > 0 && (
          <div className={progressBarClasses}>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{
                duration: toast.duration / 1000,
                ease: toast.progressAnimation || 'linear',
              }}
              className="react-toast-progress-fill"
              style={{
                backgroundColor: toast.progressBarColor || undefined,
                height: toast.progressBarThickness ? `${toast.progressBarThickness}px` : undefined,
                [toast.progressBarPosition === 'left' || toast.progressBarPosition === 'right' ? 'width' : 'height']: 
                  toast.progressBarThickness ? `${toast.progressBarThickness}px` : undefined,
              }}
            />
          </div>
        )}

        <div className="p-4 toast-content">
          {toast.variant === 'custom' && toast.component ? (
            toast.component
          ) : (
            <div className="flex items-start">
              {/* Render emoji, custom icon, SVG string icon, or nothing */}
              {emojiComponent || (toast.icon ? (
                <div className={`flex-shrink-0 mr-3 ${iconColor} toast-icon-container toast-icon-animated`}>
                  {toast.icon}
                </div>
              ) : iconString ? (
                <div className={`flex-shrink-0 mr-3 ${iconColor} toast-icon-container toast-icon-animated`}>
                  <SVGIcon svgString={iconString} className={iconColor} />
                </div>
              ) : null)}

              <div className="flex-1">
                {toast.title && <h4 className="font-medium mb-1">{toast.title}</h4>}
                {toast.description && <div>{toast.description}</div>}
              </div>

              {toast.dismissible && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="react-toast-close" /* Use the dedicated class for styling */
                  aria-label="Close notification"
                  data-dismiss="toast"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.toast.id === nextProps.toast.id &&
    prevProps.toast.updating === nextProps.toast.updating &&
    prevProps.toastTheme === nextProps.toastTheme &&
    prevProps.animation === nextProps.animation &&
    prevProps.position === nextProps.position &&
    prevProps.defaultStyle === nextProps.defaultStyle &&
    JSON.stringify(prevProps.toast.style) === JSON.stringify(nextProps.toast.style) &&
    prevProps.toast.className === nextProps.toast.className
  );
});

// Enhanced Toast container with better memoization
const ToastContainer = memo(({
  position,
  toasts,
  positionStyle,
  onDismiss,
  onPause,
  onResume,
  defaultAnimation,
  toastTheme,
  defaultStyle,
  containerClassName
}: {
  position: ToastPosition;
  toasts: Toast[];
  positionStyle: React.CSSProperties;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  defaultAnimation: ToastAnimation;
  toastTheme: 'light' | 'dark';
  defaultStyle: ToastStyle;
  containerClassName?: string;
}) => (
  <div
    className={`fixed flex flex-col z-50 react-toast-container ${containerClassName || ''}`}
    data-position={position}
    data-theme={toastTheme}
    style={positionStyle}
  >
    <AnimatePresence mode="sync">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
          animation={toast.animation || defaultAnimation}
          position={position}
          toastTheme={toastTheme}
          defaultStyle={defaultStyle}
        />
      ))}
    </AnimatePresence>
  </div>
), (prevProps, nextProps) => {
  // Only re-render if toasts array or theme changed
  return (
    prevProps.toasts.length === nextProps.toasts.length &&
    prevProps.toasts.every((toast, index) =>
      toast.id === nextProps.toasts[index]?.id &&
      toast.updating === nextProps.toasts[index]?.updating
    ) &&
    prevProps.toastTheme === nextProps.toastTheme &&
    prevProps.position === nextProps.position
  );
});

/**
 * Enhanced ToastPortal component with performance optimizations
 * This component is client-only and handles all SSR concerns internally
 */
const ToastPortal: React.FC<ToastPortalProps> = ({
  containerClassName = '',
  topOffset = 16,
  bottomOffset = 16,
  leftOffset = 16,
  rightOffset = 16,
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  enableAccessibleAnnouncements = true
}) => {
  // Always call hooks at the top level
  const [isMounted, setIsMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const [screenWidth, setScreenWidth] = useState<number>(1024); // Default for SSR
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop'); // Default for SSR

  const { toasts, removeToast, pauseToast, resumeToast, effectiveTheme } = useToastStore();

  // Throttled resize handler for better performance
  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    setScreenWidth(width);

    const newDeviceType = width < DEVICE_BREAKPOINTS.mobile
      ? 'mobile'
      : width < DEVICE_BREAKPOINTS.tablet
        ? 'tablet'
        : 'desktop';

    if (newDeviceType !== deviceType) {
      setDeviceType(newDeviceType);
    }
  }, [deviceType]);

  // Initialize portal and event listeners - only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial values
    handleResize();
    setIsMounted(true);

    let div = document.getElementById('react-toast-kit-portal') as HTMLDivElement;

    if (!div) {
      div = document.createElement('div');
      div.id = 'react-toast-kit-portal';
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '0';
      div.style.height = '0';
      div.style.zIndex = findHighestZIndex().toString();
      document.body.appendChild(div);
    }

    setPortalElement(div);

    // Throttled resize listener
    let resizeTimer: number;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimer);

      // Only remove if we created it
      if (div && div.parentNode && !document.getElementById('react-toast-kit-portal-static')) {
        document.body.removeChild(div);
      }
    };
  }, [handleResize]);

  // Memoize toasts with valid positions - always call this useMemo
  const toastsWithValidPositions = useMemo(() => {
    return toasts.map((toast) => ({
      ...toast,
      position: toast.position || ('top-right' as ToastPosition)
    }));
  }, [toasts]);

  // Memoize toasts grouped by position - always call this useMemo
  const toastsByPosition = useMemo(() => {
    return toastsWithValidPositions.reduce<Record<ToastPosition, Toast[]>>(
      (acc, toast) => {
        const position = toast.position;
        if (!acc[position]) {
          acc[position] = [];
        }
        acc[position].push(toast);
        return acc;
      },
      {} as Record<ToastPosition, Toast[]>
    );
  }, [toastsWithValidPositions]);

  // Memoize toast width calculation - always call this useCallback
  const getToastWidth = useCallback((): number => {
    return TOAST_WIDTHS[deviceType];
  }, [deviceType]);

  // Memoize position style calculation - always call this useCallback
  const getPositionStyle = useCallback((position: ToastPosition): React.CSSProperties => {
    const toastWidth = getToastWidth();

    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      width: `${toastWidth}px`,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    };

    // For mobile devices, ensure responsive width
    if (deviceType === 'mobile') {
      const safeWidth = Math.min(toastWidth, screenWidth - (leftOffset + rightOffset));
      baseStyle.width = `${safeWidth}px`;
      baseStyle.maxWidth = `calc(100vw - ${leftOffset + rightOffset}px)`;
    }

    switch (position) {
      case 'top-left':
        return {
          ...baseStyle,
          top: `${topOffset}px`,
          left: `${leftOffset}px`,
          alignItems: 'flex-start'
        };
      case 'top-center':
        return {
          ...baseStyle,
          top: `${topOffset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center'
        };
      case 'top-right':
        return {
          ...baseStyle,
          top: `${topOffset}px`,
          right: `${rightOffset}px`,
          alignItems: 'flex-end'
        };
      case 'bottom-left':
        return {
          ...baseStyle,
          bottom: `${bottomOffset}px`,
          left: `${leftOffset}px`,
          alignItems: 'flex-start'
        };
      case 'bottom-center':
        return {
          ...baseStyle,
          bottom: `${bottomOffset}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center'
        };
      case 'bottom-right':
        return {
          ...baseStyle,
          bottom: `${bottomOffset}px`,
          right: `${rightOffset}px`,
          alignItems: 'flex-end'
        };
      default:
        return {
          ...baseStyle,
          top: `${topOffset}px`,
          right: `${rightOffset}px`,
          alignItems: 'flex-end'
        };
    }
  }, [getToastWidth, deviceType, screenWidth, leftOffset, rightOffset, topOffset, bottomOffset]);

  // Always calculate currentTheme to maintain hook order
  const currentTheme = effectiveTheme || 'light';

  // Memoize portal content to prevent unnecessary re-renders - always call this useMemo
  const portalContent = useMemo(() => (
    <>
      {enableAccessibleAnnouncements && <AccessibilityAnnouncer toasts={toasts} />}
      
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <ToastContainer
          key={position}
          position={position as ToastPosition}
          toasts={positionToasts}
          positionStyle={getPositionStyle(position as ToastPosition)}
          onDismiss={removeToast}
          onPause={pauseToast}
          onResume={resumeToast}
          defaultAnimation={defaultAnimation}
          toastTheme={currentTheme as 'light' | 'dark'}
          defaultStyle={defaultStyle}
          containerClassName={containerClassName}
        />
      ))}
    </>
  ), [
    toastsByPosition,
    getPositionStyle,
    removeToast,
    pauseToast,
    resumeToast,
    defaultAnimation,
    currentTheme,
    defaultStyle,
    containerClassName,
    toasts,
    enableAccessibleAnnouncements
  ]);

  // Move conditional return after all hooks are called
  if (!isMounted || !portalElement) {
    return null;
  }

  return createPortal(portalContent, portalElement);
};

export default memo(ToastPortal);