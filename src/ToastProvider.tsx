import * as React from 'react';
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition, ToastAnimation, ToastStyle, ProgressBarStyle } from './toast';
import ToastPortal from './ToastPortal';
import { ToastDevTools } from './DevTools';

const { createContext, useContext, useEffect, useState, useRef } = React;

interface ToastProviderProps {
  children: React.ReactNode;
  
  // Basic configuration
  theme?: ToastTheme;
  position?: ToastPosition;
  maxToasts?: number;
  
  // Default styling options
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  defaultDuration?: number;
  
  // Default behavior options
  defaultDismissible?: boolean;
  defaultPauseOnHover?: boolean;
  defaultDismissOnClick?: boolean;
  
  // Progress bar defaults
  defaultProgressBarStyle?: ProgressBarStyle;
  defaultProgressBarColor?: string;
  defaultProgressBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  defaultProgressBarThickness?: number;
  defaultProgressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  
  // Advanced defaults
  defaultFloating?: boolean;
  defaultRippleEffect?: boolean;
  defaultSwipeToDismiss?: boolean;
  defaultPriority?: 'low' | 'normal' | 'high';
  defaultStagger?: number;
  
  // Container styling
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  
  // Features
  enableAccessibleAnnouncements?: boolean;
  enableDevMode?: boolean;
  enableDevTools?: boolean; // NEW: Enable visual DevTools UI
  suppressHydrationWarning?: boolean;
  
  // Global overrides (apply to all toasts unless explicitly overridden)
  globalClassName?: string;
  globalStyle?: React.CSSProperties;
}

interface ToastProviderContext {
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  position: ToastPosition;
  maxToasts: number;
  defaultAnimation: ToastAnimation;
  defaultStyle: ToastStyle;
  
  // Extended defaults
  defaultDuration: number;
  defaultDismissible: boolean;
  defaultPauseOnHover: boolean;
  defaultDismissOnClick: boolean;
  defaultProgressBarStyle?: ProgressBarStyle;
  defaultProgressBarColor?: string;
  defaultProgressBarPosition: 'top' | 'bottom' | 'left' | 'right';
  defaultProgressBarThickness: number;
  defaultProgressAnimation: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  defaultFloating: boolean;
  defaultRippleEffect: boolean;
  defaultSwipeToDismiss: boolean;
  defaultPriority: 'low' | 'normal' | 'high';
  defaultStagger: number;
  globalClassName?: string;
  globalStyle?: React.CSSProperties;
}

const ToastProviderContext = createContext<ToastProviderContext | null>(null);

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  theme = 'system',
  position = 'top-right',
  maxToasts = 3,
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  defaultDuration = 4000,
  defaultDismissible = true,
  defaultPauseOnHover = true,
  defaultDismissOnClick = false,
  defaultProgressBarStyle,
  defaultProgressBarColor,
  defaultProgressBarPosition = 'bottom',
  defaultProgressBarThickness = 3,
  defaultProgressAnimation = 'linear',
  defaultFloating = false,
  defaultRippleEffect = false,
  defaultSwipeToDismiss = false,
  defaultPriority = 'normal',
  defaultStagger = 0,
  containerClassName,
  topOffset,
  bottomOffset,
  leftOffset,
  rightOffset,
  enableAccessibleAnnouncements = true,
  enableDevMode = false,
  enableDevTools = false, // NEW: Default to false
  suppressHydrationWarning = false,
  globalClassName,
  globalStyle,
}) => {
  // Track component lifecycle using refs to prevent state updates after unmount
  const isMounted = useRef(false);
  const [initialized, setInitialized] = useState(false);
  
  // Access store methods - this must be called in every render
  const { setTheme, setMaxToasts, effectiveTheme, theme: currentTheme } = useToastStore();

  // Single effect for initialization - this runs once
  useEffect(() => {
    isMounted.current = true;
    
    // Only set theme and maxToasts if they differ from current values
    if (currentTheme !== theme) {
      setTheme(theme);
    }
    
    setMaxToasts(maxToasts);

    // Set up dev mode if enabled
    if (enableDevMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__TOAST_DEV_MODE__ = true;
      (window as any).__TOAST_DEFAULTS__ = {
        duration: defaultDuration,
        dismissible: defaultDismissible,
        pauseOnHover: defaultPauseOnHover,
        dismissOnClick: defaultDismissOnClick,
        animation: defaultAnimation,
        style: defaultStyle,
        progressBarStyle: defaultProgressBarStyle,
        progressBarColor: defaultProgressBarColor,
        progressBarPosition: defaultProgressBarPosition,
        progressBarThickness: defaultProgressBarThickness,
        progressAnimation: defaultProgressAnimation,
        floating: defaultFloating,
        rippleEffect: defaultRippleEffect,
        swipeToDismiss: defaultSwipeToDismiss,
        priority: defaultPriority,
        stagger: defaultStagger,
        globalClassName,
        globalStyle,
      };
    }
    
    // Set global defaults in window for toast function to access
    if (typeof window !== 'undefined') {
      (window as any).__TOAST_CONFIG__ = {
        defaultDuration,
        defaultDismissible,
        defaultPauseOnHover,
        defaultDismissOnClick,
        defaultAnimation,
        defaultStyle,
        defaultProgressBarStyle,
        defaultProgressBarColor,
        defaultProgressBarPosition,
        defaultProgressBarThickness,
        defaultProgressAnimation,
        defaultFloating,
        defaultRippleEffect,
        defaultSwipeToDismiss,
        defaultPriority,
        defaultStagger,
        globalClassName,
        globalStyle,
      };
    }
    
    setInitialized(true);
    
    return () => {
      isMounted.current = false;
      if (typeof window !== 'undefined') {
        delete (window as any).__TOAST_DEV_MODE__;
        delete (window as any).__TOAST_DEFAULTS__;
        delete (window as any).__TOAST_CONFIG__;
      }
    };
  }, []); // Empty deps for initial setup only

  // Track theme changes
  useEffect(() => {
    if (initialized && isMounted.current) {
      setTheme(theme);
    }
  }, [theme, initialized, setTheme]);
  
  // Track maxToasts changes
  useEffect(() => {
    if (initialized && isMounted.current) {
      setMaxToasts(maxToasts);
    }
  }, [maxToasts, initialized, setMaxToasts]);

  // Update global config when defaults change
  useEffect(() => {
    if (initialized && typeof window !== 'undefined') {
      (window as any).__TOAST_CONFIG__ = {
        defaultDuration,
        defaultDismissible,
        defaultPauseOnHover,
        defaultDismissOnClick,
        defaultAnimation,
        defaultStyle,
        defaultProgressBarStyle,
        defaultProgressBarColor,
        defaultProgressBarPosition,
        defaultProgressBarThickness,
        defaultProgressAnimation,
        defaultFloating,
        defaultRippleEffect,
        defaultSwipeToDismiss,
        defaultPriority,
        defaultStagger,
        globalClassName,
        globalStyle,
      };
    }
  }, [
    initialized,
    defaultDuration,
    defaultDismissible,
    defaultPauseOnHover,
    defaultDismissOnClick,
    defaultAnimation,
    defaultStyle,
    defaultProgressBarStyle,
    defaultProgressBarColor,
    defaultProgressBarPosition,
    defaultProgressBarThickness,
    defaultProgressAnimation,
    defaultFloating,
    defaultRippleEffect,
    defaultSwipeToDismiss,
    defaultPriority,
    defaultStagger,
    globalClassName,
    globalStyle,
  ]);

  // Monitor system theme changes
  useEffect(() => {
    if (theme === 'system' && typeof window !== 'undefined') {
      // Initial update
      useToastStore.getState().updateEffectiveTheme();
      
      // Setup theme change listener
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleThemeChange = () => {
        useToastStore.getState().updateEffectiveTheme();
      };
      
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', handleThemeChange);
      } else if (darkModeQuery.addListener) {
        darkModeQuery.addListener(handleThemeChange);
      }
      
      return () => {
        if (darkModeQuery.removeEventListener) {
          darkModeQuery.removeEventListener('change', handleThemeChange);
        } else if (darkModeQuery.removeListener) {
          darkModeQuery.removeListener(handleThemeChange);
        }
      };
    }
  }, [theme]);

  const contextValue: ToastProviderContext = {
    theme,
    effectiveTheme,
    position,
    maxToasts,
    defaultAnimation,
    defaultStyle,
    defaultDuration,
    defaultDismissible,
    defaultPauseOnHover,
    defaultDismissOnClick,
    defaultProgressBarStyle,
    defaultProgressBarColor,
    defaultProgressBarPosition,
    defaultProgressBarThickness,
    defaultProgressAnimation,
    defaultFloating,
    defaultRippleEffect,
    defaultSwipeToDismiss,
    defaultPriority,
    defaultStagger,
    globalClassName,
    globalStyle,
  };

  // Direct DevTools component rendering
  const shouldShowDevTools = enableDevTools && process.env.NODE_ENV === 'development';

  return (
    <ToastProviderContext.Provider value={contextValue}>
      {children}
      <ToastPortal
        containerClassName={containerClassName}
        topOffset={topOffset}
        bottomOffset={bottomOffset}
        leftOffset={leftOffset}
        rightOffset={rightOffset}
        defaultAnimation={defaultAnimation}
        defaultStyle={defaultStyle}
        enableAccessibleAnnouncements={enableAccessibleAnnouncements}
        suppressHydrationWarning={suppressHydrationWarning}
      />
      {shouldShowDevTools && <ToastDevTools />}
    </ToastProviderContext.Provider>
  );
};

export const useToastProvider = () => {
  const context = useContext(ToastProviderContext);
  if (!context) {
    throw new Error('useToastProvider must be used within a ToastProvider');
  }
  return context;
};