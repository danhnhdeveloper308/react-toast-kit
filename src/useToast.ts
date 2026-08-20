import * as React from 'react';
import { useToastStore } from './toast';
import type { ToastTheme, ToastPosition } from './toast';

const { useCallback, useMemo } = React;

const shallowEqual = <T extends Record<string, unknown>>(previous: T, next: T) => {
  if (Object.is(previous, next)) return true;
  const keys = Object.keys(previous);
  return (
    keys.length === Object.keys(next).length &&
    keys.every((key) => Object.is(previous[key], next[key]))
  );
};

/**
 * Primary hook — exposes toast state and actions for component use.
 * Uses a shallow selector so consumers only re-render when user-facing
 * state changes (toasts list, theme, maxToasts, plugins). Internal timer
 * bookkeeping (activeTimers, timerStartedAt, remainingTime, pausedToasts)
 * does NOT cause re-renders here.
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
    unregisterPlugin,
  } = useToastStore(
    (state) => ({
      toasts: state.toasts,
      theme: state.theme,
      effectiveTheme: state.effectiveTheme,
      maxToasts: state.maxToasts,
      plugins: state.plugins,
      addToast: state.addToast,
      removeToast: state.removeToast,
      updateToast: state.updateToast,
      clearAllToasts: state.clearAllToasts,
      pauseToast: state.pauseToast,
      resumeToast: state.resumeToast,
      setTheme: state.setTheme,
      setMaxToasts: state.setMaxToasts,
      registerPlugin: state.registerPlugin,
      unregisterPlugin: state.unregisterPlugin,
    }),
    shallowEqual
  );

  const stats = useMemo(
    () => ({
      total: toasts.length,
      byVariant: toasts.reduce<Record<string, number>>((acc, t) => {
        acc[t.variant] = (acc[t.variant] || 0) + 1;
        return acc;
      }, {}),
      byPosition: toasts.reduce<Record<ToastPosition, number>>(
        (acc, t) => {
          acc[t.position] = (acc[t.position] || 0) + 1;
          return acc;
        },
        {} as Record<ToastPosition, number>
      ),
    }),
    [toasts]
  );

  const getToastById = useCallback((id: string) => toasts.find((t) => t.id === id), [toasts]);
  const hasToasts = useCallback(() => toasts.length > 0, [toasts]);

  return {
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
    unregisterPlugin,
    getToastById,
    hasToasts,
    stats,
  };
};

/**
 * Lightweight hook for reading/setting theme and maxToasts only.
 */
export const useToastConfig = () =>
  useToastStore(
    (state) => ({
      theme: state.theme,
      effectiveTheme: state.effectiveTheme,
      setTheme: state.setTheme,
      maxToasts: state.maxToasts,
      setMaxToasts: state.setMaxToasts,
    }),
    shallowEqual
  );

/**
 * Derived statistics hook — useful for analytics or custom UI.
 */
export const useToastStats = () => {
  const toasts = useToastStore((state) => state.toasts);
  return useMemo(
    () => ({
      total: toasts.length,
      byVariant: toasts.reduce(
        (acc, t) => {
          acc[t.variant] = (acc[t.variant] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byPosition: toasts.reduce(
        (acc, t) => {
          acc[t.position] = (acc[t.position] || 0) + 1;
          return acc;
        },
        {} as Record<ToastPosition, number>
      ),
      byTheme: toasts.reduce(
        (acc, t) => {
          acc[t.theme] = (acc[t.theme] || 0) + 1;
          return acc;
        },
        {} as Record<ToastTheme, number>
      ),
    }),
    [toasts]
  );
};
