import { useCallback, useMemo, useEffect, useState } from 'react';
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition } from './toast';

/**
 * Theme detector hook that safely manages React hooks lifecycle
 */
export function useThemeDetector() {
  // Always call useState first
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    // Safe initialization that works on both server and client
    return typeof window !== 'undefined' ? useToastStore.getState().effectiveTheme : 'light';
  });

  // Always call useEffect for subscription
  useEffect(() => {
    // Subscribe to theme changes from the store
    const unsubscribe = useToastStore.subscribe((state) => {
      if (state.effectiveTheme !== effectiveTheme) {
        setEffectiveTheme(state.effectiveTheme);
      }
    });

    // Setup media query listener only on client
    let mediaQueryCleanup: (() => void) | null = null;

    if (typeof window !== 'undefined') {
      try {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
          if (useToastStore.getState().theme === 'system') {
            useToastStore.getState().updateEffectiveTheme();
          }
        };
        
        if (darkModeMediaQuery.addEventListener) {
          darkModeMediaQuery.addEventListener('change', handleChange);
          mediaQueryCleanup = () => darkModeMediaQuery.removeEventListener('change', handleChange);
        } else {
          // Fallback for older browsers
          darkModeMediaQuery.addListener(handleChange);
          mediaQueryCleanup = () => darkModeMediaQuery.removeListener(handleChange);
        }

        // Initial update
        useToastStore.getState().updateEffectiveTheme();
      } catch (error) {
        console.warn('React Toast Kit: Failed to setup media query listener', error);
      }
    }
    
    // Always return cleanup function
    return () => {
      unsubscribe();
      if (mediaQueryCleanup) {
        mediaQueryCleanup();
      }
    };
  }, []); // Remove effectiveTheme from dependencies to avoid unnecessary re-renders

  return effectiveTheme;
}

/**
 * Hook to access toast functionality
 * Provides a convenient way to access toast functions and state
 */
export const useToast = () => {
  const {
    toasts,
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    theme,
    effectiveTheme,
    setTheme,
    maxToasts,
    setMaxToasts,
    pauseToast,
    resumeToast,
    plugins,
    registerPlugin,
    unregisterPlugin
  } = useToastStore();

  const getToastById = useCallback((id: string) => toasts.find(t => t.id === id), [toasts]);
  
  const getToastsByPosition = useCallback((position: ToastPosition) => 
    toasts.filter(t => t.position === position), [toasts]);
  
  const hasToasts = useCallback(() => toasts.length > 0, [toasts]);

  const stats = useMemo(() => ({
    total: toasts.length,
    byVariant: toasts.reduce((acc, toast) => {
      acc[toast.variant] = (acc[toast.variant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPosition: toasts.reduce((acc, toast) => {
      acc[toast.position] = (acc[toast.position] || 0) + 1;
      return acc;
    }, {} as Record<ToastPosition, number>)
  }), [toasts]);

  return {
    // Toast state
    toasts,
    theme,
    effectiveTheme,
    maxToasts,
    plugins,
    
    // Toast actions
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    pauseToast,
    resumeToast,
    
    // Settings
    setTheme,
    setMaxToasts,
    
    // Plugin system
    registerPlugin,
    unregisterPlugin,
    
    // Utility methods
    getToastById,
    getToastsByPosition,
    hasToasts,
    
    // Statistics
    stats
  };
};

/**
 * Hook to access toast configuration
 */
export const useToastConfig = () => {
  const { theme, effectiveTheme, setTheme, maxToasts, setMaxToasts } = useToastStore();
  
  return {
    theme,
    effectiveTheme,
    setTheme,
    maxToasts,
    setMaxToasts,
  };
};

/**
 * Hook to access toast statistics
 */
export const useToastStats = () => {
  const { toasts } = useToastStore();
  
  return useMemo(() => ({
    total: toasts.length,
    byVariant: toasts.reduce((acc, toast) => {
      acc[toast.variant] = (acc[toast.variant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPosition: toasts.reduce((acc, toast) => {
      acc[toast.position] = (acc[toast.position] || 0) + 1;
      return acc;
    }, {} as Record<ToastPosition, number>),
    byTheme: toasts.reduce((acc, toast) => {
      acc[toast.theme] = (acc[toast.theme] || 0) + 1;
      return acc;
    }, {} as Record<ToastTheme, number>)
  }), [toasts]);
};