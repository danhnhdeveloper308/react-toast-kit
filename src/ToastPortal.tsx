import React, { useEffect, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from './toast';
import { AnimatePresence, motion } from 'framer-motion';
import type { Toast, ToastPosition } from './toast';

/**
 * Finds the highest z-index in use in the document
 * @returns {number} Highest z-index + 1
 */
const findHighestZIndex = (): number => {
  let highestZ = 9000; // Default high value
  const elements = document.getElementsByTagName('*');
  
  for (let i = 0; i < elements.length; i++) {
    const zIndex = parseInt(window.getComputedStyle(elements[i]).zIndex, 10);
    if (zIndex && zIndex > highestZ) {
      highestZ = zIndex;
    }
  }
  
  return highestZ + 1;
};

interface ToastPortalProps {
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  defaultAnimation?: 'slide' | 'fade' | 'bounce' | 'none';
}

// SVG Icon component that renders SVG from string using dangerouslySetInnerHTML
const SVGIcon: React.FC<{ svgString: string }> = memo(({ svgString }) => (
  <span 
    className="inline-block" 
    dangerouslySetInnerHTML={{ __html: svgString }} 
  />
));

// Individual Toast component to improve rendering performance
const ToastItem = memo(({ 
  toast, 
  onDismiss, 
  onPause, 
  onResume, 
  animation,
  position,
  toastTheme
}: { 
  toast: Toast, 
  onDismiss: (id: string) => void,
  onPause: (id: string) => void,
  onResume: (id: string) => void,
  animation: 'slide' | 'fade' | 'bounce' | 'none',
  position: ToastPosition,
  toastTheme: 'light' | 'dark'
}) => {
  // Variant styles
  const getVariantClasses = (variant: Toast['variant']): string => {
    const isDark = toastTheme === 'dark';
    
    switch (variant) {
      case 'success':
        return isDark ? 'bg-green-700 text-white' : 'bg-green-500 text-white';
      case 'error':
        return isDark ? 'bg-red-700 text-white' : 'bg-red-500 text-white';
      case 'warning':
        return isDark ? 'bg-amber-700 text-white' : 'bg-amber-500 text-white';
      case 'info':
        return isDark ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white';
      case 'loading':
        return isDark ? 'bg-gray-700 text-white' : 'bg-gray-500 text-white';
      case 'custom':
        return '';
      default:
        return isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200';
    }
  };

  // Get animation variants based on animation type and position
  const getAnimationVariants = (
    animationType: 'slide' | 'fade' | 'bounce' | 'none',
    toastPosition: ToastPosition
  ) => {
    const isTop = toastPosition.startsWith('top');
    const isBottom = toastPosition.startsWith('bottom');
    const isLeft = toastPosition.endsWith('left');
    const isRight = toastPosition.endsWith('right');
    const isCenter = toastPosition.endsWith('center');
    
    // No animation
    if (animationType === 'none') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 }
      };
    }
    
    // Fade animation
    if (animationType === 'fade') {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
      };
    }
    
    // Bounce animation
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
  };

  const animationType = toast.animation || animation;
  const variants = getAnimationVariants(animationType, position);
  // Check for iconString property added in toast.ts
  const iconString = (toast as any).iconString;
  
  return (
    <motion.div
      key={toast.id}
      className="react-toast-item"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{ duration: (toast as any).updating ? 0.1 : 0.2 }}
      layout
    >
      <div
        role={toast.variant === 'error' ? 'alert' : 'status'}
        aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
        className={`relative overflow-hidden shadow-lg rounded-lg ${getVariantClasses(toast.variant)} ${toast.className || ''} react-toast`}
        style={toast.style}
        onMouseEnter={() => toast.pauseOnHover && onPause(toast.id)}
        onMouseLeave={() => onResume(toast.id)}
        onClick={() => toast.dismissOnClick && onDismiss(toast.id)}
        data-variant={toast.variant}
        data-testid={`toast-${toast.id}`}
        tabIndex={0}
      >
        {/* Progress indicator for timed toasts */}
        {toast.duration > 0 && (
          <motion.div 
            initial={{ width: '100%' }} 
            animate={{ width: '0%' }}
            transition={{ 
              duration: toast.duration / 1000,
              ease: 'linear',
            }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 react-toast-progress"
          />
        )}
        
        <div className="p-4 toast-content">
          {toast.variant === 'custom' && toast.component ? (
            toast.component
          ) : (
            <div className="flex items-start">
              {/* Render either custom icon, SVG string icon, or nothing */}
              {toast.icon ? (
                <div className="flex-shrink-0 mr-3">{toast.icon}</div>
              ) : iconString ? (
                <div className="flex-shrink-0 mr-3">
                  <SVGIcon svgString={iconString} />
                </div>
              ) : null}
              
              <div className="flex-1">
                {toast.title && <h4 className="font-medium mb-1">{toast.title}</h4>}
                {toast.description && <div>{toast.description}</div>}
              </div>
              
              {toast.dismissible && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                  }}
                  className="flex-shrink-0 ml-3 text-white/80 hover:text-white focus:outline-none"
                  aria-label="Close"
                  data-dismiss="toast"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
});

// Toast container component to organize toasts by position
const ToastContainer = memo(({
  position,
  toasts,
  positionStyle,
  onDismiss,
  onPause,
  onResume,
  defaultAnimation,
  toastTheme
}: {
  position: ToastPosition,
  toasts: Toast[],
  positionStyle: React.CSSProperties,
  onDismiss: (id: string) => void,
  onPause: (id: string) => void,
  onResume: (id: string) => void,
  defaultAnimation: 'slide' | 'fade' | 'bounce' | 'none',
  toastTheme: 'light' | 'dark'
}) => (
  <div 
    className={`fixed flex flex-col z-50 react-toast-container`}
    data-position={position}
    style={{ 
      gap: '0.5rem',
      maxWidth: 'calc(100vw - 2rem)',
      width: '380px',
      ...positionStyle
    }}
  >
    <AnimatePresence mode="sync">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
          animation={defaultAnimation}
          position={position}
          toastTheme={toastTheme}
        />
      ))}
    </AnimatePresence>
  </div>
));

/**
 * ToastPortal component that renders toasts using React.createPortal
 * This ensures toasts are rendered at the document body level, outside of any layout constraints
 */
const ToastPortal: React.FC<ToastPortalProps> = ({
  containerClassName = '',
  topOffset = 16,
  bottomOffset = 16,
  leftOffset = 16,
  rightOffset = 16,
  defaultAnimation = 'slide'
}) => {
  // State to track if we're on the client side
  const [isMounted, setIsMounted] = useState(false);
  
  // Get toasts and store actions from the Zustand store
  const { toasts, removeToast, pauseToast, resumeToast, theme } = useToastStore();
  
  // Create ref for portal container
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  
  // Initialize when component mounts
  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'react-toast-kit-portal';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '0';
    div.style.height = '0';
    div.style.zIndex = findHighestZIndex().toString();
    document.body.appendChild(div);
    
    setPortalElement(div);
    setIsMounted(true);
    
    return () => {
      document.body.removeChild(div);
    };
  }, []);
  
  // Group toasts by position
  const toastsByPosition = toasts.reduce<Record<ToastPosition, Toast[]>>(
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
  
  // Get position style with offsets
  const getPositionStyle = (position: ToastPosition): React.CSSProperties => {
    switch (position) {
      case 'top-left':
        return { top: `${topOffset}px`, left: `${leftOffset}px` };
      case 'top-center':
        return { top: `${topOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right':
        return { top: `${topOffset}px`, right: `${rightOffset}px` };
      case 'bottom-left':
        return { bottom: `${bottomOffset}px`, left: `${leftOffset}px` };
      case 'bottom-center':
        return { bottom: `${bottomOffset}px`, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right':
        return { bottom: `${bottomOffset}px`, right: `${rightOffset}px` };
      default:
        return { top: `${topOffset}px`, right: `${rightOffset}px` };
    }
  };

  // Don't render anything on the server or if not mounted yet
  if (!isMounted || !portalElement) return null;

  // Determine the current effective theme
  const currentTheme = theme === 'system' 
    ? (typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light') 
    : theme;
  
  // Create portal content
  const portalContent = (
    <>
      {/* Toast containers for each position */}
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
        />
      ))}
    </>
  );
  
  // Return the portal
  return createPortal(portalContent, portalElement);
};

export default memo(ToastPortal);