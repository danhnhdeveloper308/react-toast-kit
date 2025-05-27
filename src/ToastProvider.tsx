import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition, ToastAnimation, ToastStyle } from './toast';
import ToastPortal from './ToastPortal';

interface ToastProviderProps {
  children: React.ReactNode;
  theme?: ToastTheme;
  position?: ToastPosition;
  maxToasts?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  enableAccessibleAnnouncements?: boolean;
  enableDevMode?: boolean;
  suppressHydrationWarning?: boolean;
}

interface ToastProviderContext {
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  position: ToastPosition;
  maxToasts: number;
  defaultAnimation: ToastAnimation;
  defaultStyle: ToastStyle;
}

const ToastProviderContext = createContext<ToastProviderContext | null>(null);

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  theme = 'system',
  position = 'top-right',
  maxToasts = 3,
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  containerClassName,
  topOffset,
  bottomOffset,
  leftOffset,
  rightOffset,
  enableAccessibleAnnouncements = true,
  enableDevMode = false,
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
    }
    
    setInitialized(true);
    
    return () => {
      isMounted.current = false;
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

  const contextValue: ToastProviderContext = {
    theme,
    effectiveTheme,
    position,
    maxToasts,
    defaultAnimation,
    defaultStyle,
  };

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
      />
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