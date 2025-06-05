import * as React from 'react';
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition } from './toast';

const { useCallback, useMemo } = React;

/**
 * Hook to access toast functionality
 * Provides a convenient way to access toast functions and state
 */
export const useToast = () => {
  const { 
    toasts, 
    theme, 
    effectiveTheme, 
    maxToasts, 
    plugins,
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    pauseToast,
    resumeToast,
    setTheme,
    setMaxToasts,
    registerPlugin,
    unregisterPlugin
  } = useToastStore();

  // Memoize toast statistics for performance
  const stats = useMemo(() => {
    const total = toasts.length;
    const byVariant = toasts.reduce<Record<string, number>>((acc, toast) => {
      acc[toast.variant] = (acc[toast.variant] || 0) + 1;
      return acc;
    }, {});
    
    const byPosition = toasts.reduce<Record<ToastPosition, number>>((acc, toast) => {
      acc[toast.position] = (acc[toast.position] || 0) + 1;
      return acc;
    }, {} as Record<ToastPosition, number>);

    return { total, byVariant, byPosition };
  }, [toasts]);

  // Helper function to get toast by ID
  const getToastById = useCallback((id: string) => {
    return toasts.find(toast => toast.id === id);
  }, [toasts]);

  // Helper function to check if there are any toasts
  const hasToasts = useCallback(() => {
    return toasts.length > 0;
  }, [toasts]);

  return {
    // State
    toasts,
    theme,
    effectiveTheme,
    maxToasts,
    plugins,
    
    // Actions
    addToast,
    removeToast,
    updateToast,
    clearAllToasts,
    pauseToast,
    resumeToast,
    setTheme,
    setMaxToasts,
    registerPlugin,
    unregisterPlugin,
    
    // Helpers
    getToastById,
    hasToasts,
    stats,
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