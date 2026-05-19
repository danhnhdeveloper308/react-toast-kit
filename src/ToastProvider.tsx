import * as React from 'react';

declare global {
  interface Window {
    __TOAST_DEV_MODE__?: boolean;
  }
}
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition, ToastAnimation, ToastStyle, ProgressBarStyle } from './toast';
import ToastPortal from './ToastPortal';

const { createContext, useContext, useEffect, useMemo } = React;

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
  enableDevTools?: boolean;
  suppressHydrationWarning?: boolean;

  // Global overrides
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
  enableDevTools = false,
  suppressHydrationWarning = false,
  globalClassName,
  globalStyle,
}) => {
  const { setTheme, setMaxToasts, setConfig, effectiveTheme } = useToastStore();

  // Sync theme and maxToasts into the store
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    setMaxToasts(maxToasts);
  }, [maxToasts, setMaxToasts]);

  // Sync all provider defaults into the store so the imperative toast() API
  // can access them without window globals.
  useEffect(() => {
    setConfig({
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
    });
  }, [
    setConfig,
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

  // Dev mode: expose store reference on window for debugging
  useEffect(() => {
    if (enableDevMode && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.__TOAST_DEV_MODE__ = true;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__TOAST_DEV_MODE__;
      }
    };
  }, [enableDevMode]);

  const contextValue = useMemo<ToastProviderContext>(
    () => ({
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
    }),
    [
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
    ]
  );

  // DevTools are only rendered in development and only when explicitly enabled.
  // Loaded lazily to keep the main bundle free of DevTools code.
  const DevToolsComponent = useMemo(() => {
    if (!enableDevTools || process.env.NODE_ENV !== 'development') return null;
    // Lazy-require so the DevTools module is excluded from production bundles
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ToastDevTools } = require('./DevTools');
    return ToastDevTools as React.FC;
  }, [enableDevTools]);

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
      {DevToolsComponent && <DevToolsComponent />}
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
