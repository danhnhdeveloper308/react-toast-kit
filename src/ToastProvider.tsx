import React, { useEffect } from 'react';
import { useToastStore, ToastPosition, ToastTheme } from './toast';
import ToastPortal from './ToastPortal';

// Define props interface for ToastProvider
interface ToastProviderProps {
  children?: React.ReactNode;
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
  maxToasts?: number;
  /** Offset from the top edge (for sticky headers) in pixels */
  topOffset?: number;
  /** Offset from the bottom edge (for sticky footers) in pixels */
  bottomOffset?: number;
  /** Offset from the left edge in pixels */
  leftOffset?: number;
  /** Offset from the right edge in pixels */
  rightOffset?: number;
  /** Default animation style */
  defaultAnimation?: 'slide' | 'fade' | 'bounce' | 'none';
  /** Enable accessible announcements for screen readers */
  enableAccessibleAnnouncements?: boolean;
  /** Custom class name for the toast container */
  containerClassName?: string;
  /** Additional global style options */
  toastClassName?: string;
}

// Main ToastProvider component
const ToastProviderComponent: React.FC<ToastProviderProps> = ({
  children,
  defaultDuration = 4000,
  defaultPosition = 'top-right',
  defaultTheme = 'system',
  defaultAnimation = 'slide',
  maxToasts = 3,
  topOffset = 16, // default to 1rem (16px)
  bottomOffset = 16, // default to 1rem (16px)
  leftOffset = 16, // default to 1rem (16px)
  rightOffset = 16, // default to 1rem (16px)
  enableAccessibleAnnouncements = true,
  containerClassName = '',
  toastClassName = '',
}) => {
  const { 
    toasts, 
    removeToast, 
    pausedToasts, 
    theme,
    setTheme,
    setMaxToasts
  } = useToastStore();

  // Initialize store with props values on first render
  useEffect(() => {
    // Apply the default configuration values
    setMaxToasts(maxToasts);
    
    // Only set theme if current theme is 'system' (default)
    if (theme === 'system' && defaultTheme !== 'system') {
      setTheme(defaultTheme);
    }
    
    // These values are used in createToast function in toast.ts
    // Expose them on the window object for the toast module to reference
    if (typeof window !== 'undefined') {
      (window as any).__TOAST_CONFIG__ = {
        defaultDuration,
        defaultPosition,
        defaultTheme,
        defaultAnimation,
        topOffset,
        bottomOffset,
        leftOffset,
        rightOffset,
        toastClassName,
      };
    }
  }, [defaultDuration, defaultPosition, defaultTheme, defaultAnimation, maxToasts, setMaxToasts, setTheme, theme, 
      topOffset, bottomOffset, leftOffset, rightOffset, toastClassName]);

  // System theme detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
      };
      
      // Set initial value
      handleChange();
      
      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  // Auto-dismiss timers
  useEffect(() => {
    const timers = toasts.map((toast) => {
      // Skip if toast is paused, has no duration, or is a loading toast
      if (pausedToasts.has(toast.id) || !toast.duration) {
        return null;
      }
      return setTimeout(() => removeToast(toast.id), toast.duration);
    });

    return () => {
      timers.forEach((timer) => timer && clearTimeout(timer));
    };
  }, [toasts, removeToast, pausedToasts]);

  // Accessibility announcements for screen readers
  const [announcement, setAnnouncement] = React.useState<string | null>(null);

  // Update announcement when toasts change
  useEffect(() => {
    if (!enableAccessibleAnnouncements) return;
    
    // Find newest toast
    const newestToast = [...toasts].sort((a, b) => b.createdAt - a.createdAt)[0];
    
    if (newestToast && (newestToast as any)._announced !== true) {
      // Mark toast as announced
      (newestToast as any)._announced = true;
      
      // Create announcement text
      let text = '';
      if (newestToast.variant !== 'custom') {
        if (newestToast.title) text += newestToast.title;
        if (newestToast.description) {
          if (text) text += ': ';
          text += newestToast.description;
        }
        
        // Set announcement
        setAnnouncement(text);
        
        // Clear after a delay
        setTimeout(() => {
          setAnnouncement(null);
        }, 1000);
      }
    }
  }, [toasts, enableAccessibleAnnouncements]);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find the newest dismissible toast and dismiss it
        const dismissibleToasts = toasts.filter(t => t.dismissible);
        if (dismissibleToasts.length > 0) {
          const newestToast = [...dismissibleToasts].sort((a, b) => b.createdAt - a.createdAt)[0];
          removeToast(newestToast.id);
        }
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [toasts, removeToast]);

  return (
    <>
      {children}
      
      {/* Accessibility announcement region */}
      {enableAccessibleAnnouncements && (
        <div
          role="region"
          aria-live="assertive"
          className="sr-only"
        >
          {announcement}
        </div>
      )}

      {/* Use the ToastPortal component for rendering toasts */}
      <ToastPortal 
        containerClassName={containerClassName}
        topOffset={topOffset}
        bottomOffset={bottomOffset}
        leftOffset={leftOffset}
        rightOffset={rightOffset}
        defaultAnimation={defaultAnimation}
      />
    </>
  );
};

// Client component wrapper for Next.js
// This component is exported with 'use client' directive to ensure it's only rendered on the client side
export const ToastProvider: React.FC<ToastProviderProps> = (props) => {
  if (typeof window === 'undefined') {
    // On server side, just render children
    return <>{props.children}</>;
  }

  // On client side, use the full provider component
  return <ToastProviderComponent {...props} />;
};