import React, { createContext, useContext, useEffect } from 'react';
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
  const { setTheme, setMaxToasts, effectiveTheme } = useToastStore();
  
  useEffect(() => {
    setTheme(theme);
    setMaxToasts(maxToasts);
    
    // Initialize dev mode if enabled
    if (enableDevMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).__TOAST_DEV_MODE__ = true;
    }
  }, [theme, maxToasts, setTheme, setMaxToasts, enableDevMode]);

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