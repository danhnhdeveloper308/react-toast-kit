import { JSX } from 'react';
import { create } from 'zustand';

export type ToastPosition =
  | 'top-right'
  | 'top-center'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'default' | 'custom' | 'loading';
export type ToastTheme = 'light' | 'dark' | 'system';
export type ToastAnimation = 'slide' | 'fade' | 'bounce' | 'flip' | 'zoom' | 'none' | 'elastic';
export type ToastStyle = 'solid' | 'gradient' | 'glass' | 'shimmer' | 'pill' | 'neon' | 'retro' | 'confetti' | 'minimal' | 'outlined';

export interface ToastAction {
  label: string;
  onClick: (id: string) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  closeOnClick?: boolean;
}

export type ProgressBarStyle =
  | 'default'
  | 'fancy'
  | 'gradient-wave'
  | 'pulse'
  | 'particles'
  | 'liquid'
  | 'three-d'
  | 'dashed'
  | 'glow'
  | 'rainbow'
  | 'data-flow'
  | 'step-progress';

export interface CustomAnimation {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit: Record<string, unknown>;
  transition?: Record<string, unknown>;
}

export interface ToastPlugin {
  name: string;
  description?: string;
  beforeCreate?: (options: ToastOptions) => ToastOptions;
  afterCreate?: (toast: Toast) => void;
  beforeRemove?: (toast: Toast) => boolean;
  afterRemove?: (toast: Toast) => void;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  pauseOnHover?: boolean;
  dismissOnClick?: boolean;
  theme?: ToastTheme;
  icon?: JSX.Element;
  component?: JSX.Element;
  onDismiss?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  animation?: ToastAnimation;
  customAnimation?: CustomAnimation;
  visualStyle?: ToastStyle;
  progressBarStyle?: ProgressBarStyle;
  progressBarColor?: string;
  progressBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  progressBarThickness?: number;
  floating?: boolean;
  emoji?: string;
  rippleEffect?: boolean;
  stagger?: number;
  swipeToDismiss?: boolean;
  priority?: 'low' | 'normal' | 'high';
  progressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  actions?: ToastAction[];
}

export interface StrictToastOptions extends Omit<ToastOptions, 'variant' | 'position'> {
  variant: ToastVariant;
  position: ToastPosition;
}

export interface Toast extends Required<Pick<ToastOptions, 'id' | 'variant' | 'position' | 'duration' | 'pauseOnHover' | 'dismissible' | 'dismissOnClick' | 'theme'>> {
  title?: string;
  description?: string;
  icon?: JSX.Element;
  component?: JSX.Element;
  createdAt: number;
  onDismiss?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
  animation?: ToastAnimation;
  customAnimation?: CustomAnimation;
  visualStyle?: ToastStyle;
  progressBarStyle?: ProgressBarStyle;
  progressBarColor?: string;
  progressBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  progressBarThickness?: number;
  floating?: boolean;
  emoji?: string;
  rippleEffect?: boolean;
  stagger?: number;
  swipeToDismiss?: boolean;
  priority?: 'low' | 'normal' | 'high';
  progressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  actions?: ToastAction[];
  iconString?: string;
  updating?: boolean;
}

// Provider-level defaults stored in the Zustand store so the imperative
// `toast()` API can read them without relying on window globals.
export interface ToastStoreConfig {
  defaultDuration: number;
  defaultDismissible: boolean;
  defaultPauseOnHover: boolean;
  defaultDismissOnClick: boolean;
  defaultAnimation: ToastAnimation;
  defaultStyle: ToastStyle;
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

const DEFAULT_CONFIG: ToastStoreConfig = {
  defaultDuration: 4000,
  defaultDismissible: true,
  defaultPauseOnHover: true,
  defaultDismissOnClick: false,
  defaultAnimation: 'slide',
  defaultStyle: 'solid',
  defaultProgressBarPosition: 'bottom',
  defaultProgressBarThickness: 3,
  defaultProgressAnimation: 'linear',
  defaultFloating: false,
  defaultRippleEffect: false,
  defaultSwipeToDismiss: false,
  defaultPriority: 'normal',
  defaultStagger: 0,
};

const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_THEME: ToastTheme = 'system';
const DEFAULT_MAX_TOASTS = 3;

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  pausedToasts: Set<string>;
  activeTimers: Map<string, number>;
  // Tracks when each active timer was started so we can compute remaining time on pause
  timerStartedAt: Map<string, number>;
  // Stores the remaining ms for paused toasts so resume restarts from the right point
  remainingTime: Map<string, number>;
  plugins: ToastPlugin[];
  config: ToastStoreConfig;

  addToast: (toast: Toast) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  clearAllToasts: () => void;
  setTheme: (theme: ToastTheme) => void;
  setMaxToasts: (max: number) => void;
  updateEffectiveTheme: () => void;
  setConfig: (config: Partial<ToastStoreConfig>) => void;
  cleanup: () => void;
  registerPlugin: (plugin: ToastPlugin) => void;
  unregisterPlugin: (name: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  maxToasts: DEFAULT_MAX_TOASTS,
  theme: DEFAULT_THEME,
  effectiveTheme: getSystemTheme(),
  pausedToasts: new Set<string>(),
  activeTimers: new Map<string, number>(),
  timerStartedAt: new Map<string, number>(),
  remainingTime: new Map<string, number>(),
  plugins: [],
  config: DEFAULT_CONFIG,

  setConfig: (config) => {
    set((state) => ({ config: { ...state.config, ...config } }));
  },

  addToast: (toast) => {
    try {
      const { plugins, activeTimers, pausedToasts } = get();

      let processedToast: Toast = toast;

      for (const plugin of plugins) {
        if (plugin.beforeCreate) {
          const result = plugin.beforeCreate(processedToast as unknown as ToastOptions);
          let mergedStyle: React.CSSProperties | undefined;
          if (result.style || processedToast.style) {
            mergedStyle = { ...(processedToast.style || {}), ...(result.style || {}) };
          }
          processedToast = {
            ...processedToast,
            ...result,
            id: result.id || processedToast.id,
            variant: result.variant || processedToast.variant,
            position: result.position || processedToast.position,
            duration: result.duration !== undefined ? result.duration : processedToast.duration,
            pauseOnHover: result.pauseOnHover !== undefined ? result.pauseOnHover : processedToast.pauseOnHover,
            dismissible: result.dismissible !== undefined ? result.dismissible : processedToast.dismissible,
            dismissOnClick: result.dismissOnClick !== undefined ? result.dismissOnClick : processedToast.dismissOnClick,
            theme: result.theme || processedToast.theme,
            createdAt: processedToast.createdAt,
            style: mergedStyle,
            iconString: processedToast.iconString,
            updating: processedToast.updating,
          };
        }
      }

      // Remove oldest toast if at capacity (read fresh state after potential prior removals)
      const toastsBeforeAdd = get().toasts;
      if (toastsBeforeAdd.length >= get().maxToasts) {
        const oldest = [...toastsBeforeAdd]
          .sort((a, b) => a.createdAt - b.createdAt)
          .find((t) => t.id !== processedToast.id);
        if (oldest) {
          get().removeToast(oldest.id);
        }
      }

      // Re-read fresh state after potential removal and compute insert position
      const freshToasts = get().toasts;
      let insertIndex = freshToasts.length;
      if (processedToast.priority === 'high') {
        insertIndex = 0;
      } else if (processedToast.priority === 'normal') {
        const lowPriorityIndex = freshToasts.findIndex((t) => t.priority === 'low');
        if (lowPriorityIndex !== -1) insertIndex = lowPriorityIndex;
      }

      const updatedToasts = [...freshToasts];
      updatedToasts.splice(insertIndex, 0, processedToast);
      set({ toasts: updatedToasts });

      // Set up auto-dismiss timer
      if (processedToast.duration > 0 && !pausedToasts.has(processedToast.id)) {
        const existing = activeTimers.get(processedToast.id);
        if (existing) clearTimeout(existing);

        const now = Date.now();
        const timerId = window.setTimeout(() => {
          get().removeToast(processedToast.id);
        }, processedToast.duration) as unknown as number;

        set((state) => ({
          activeTimers: new Map(state.activeTimers).set(processedToast.id, timerId),
          timerStartedAt: new Map(state.timerStartedAt).set(processedToast.id, now),
        }));
      }

      for (const plugin of plugins) {
        plugin.afterCreate?.(processedToast);
      }

      return processedToast.id;
    } catch (error) {
      console.error('React Toast Kit: Failed to add toast', error);
      return '';
    }
  },

  removeToast: (id) => {
    try {
      const { toasts, plugins, activeTimers } = get();
      const toast = toasts.find((t) => t.id === id);
      if (!toast) return;

      let shouldRemove = true;
      for (const plugin of plugins) {
        if (plugin.beforeRemove?.(toast) === false) {
          shouldRemove = false;
        }
      }
      if (!shouldRemove) return;

      const timerId = activeTimers.get(id);
      if (timerId) clearTimeout(timerId);

      toast.onDismiss?.(id);

      set((state) => {
        const newActiveTimers = new Map(state.activeTimers);
        newActiveTimers.delete(id);
        const newTimerStartedAt = new Map(state.timerStartedAt);
        newTimerStartedAt.delete(id);
        const newRemainingTime = new Map(state.remainingTime);
        newRemainingTime.delete(id);
        const newPausedToasts = new Set(state.pausedToasts);
        newPausedToasts.delete(id);
        return {
          toasts: state.toasts.filter((t) => t.id !== id),
          pausedToasts: newPausedToasts,
          activeTimers: newActiveTimers,
          timerStartedAt: newTimerStartedAt,
          remainingTime: newRemainingTime,
        };
      });

      for (const plugin of plugins) {
        plugin.afterRemove?.(toast);
      }
    } catch (error) {
      console.error('React Toast Kit: Failed to remove toast', error);
    }
  },

  updateToast: (id, updatedFields) => {
    try {
      set((state) => ({
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, ...updatedFields, updating: true } : t
        ),
      }));

      // Reset timer if duration changed
      if (updatedFields.duration !== undefined) {
        const { activeTimers, pausedToasts } = get();
        const existingTimer = activeTimers.get(id);
        if (existingTimer) clearTimeout(existingTimer);

        const updated = get().toasts.find((t) => t.id === id);
        if (updated && updated.duration > 0 && !pausedToasts.has(id)) {
          const now = Date.now();
          const newTimerId = window.setTimeout(() => {
            get().removeToast(id);
          }, updated.duration) as unknown as number;

          set((state) => ({
            activeTimers: new Map(state.activeTimers).set(id, newTimerId),
            timerStartedAt: new Map(state.timerStartedAt).set(id, now),
            remainingTime: (() => {
              const m = new Map(state.remainingTime);
              m.delete(id);
              return m;
            })(),
          }));
        }
      }

      // Clear updating flag after animation frame
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.map((t) => (t.id === id ? { ...t, updating: false } : t)),
        }));
      }, 100);
    } catch (error) {
      console.error('React Toast Kit: Failed to update toast', error);
    }
  },

  pauseToast: (id) => {
    const { activeTimers, timerStartedAt } = get();
    const existingTimer = activeTimers.get(id);

    if (existingTimer) {
      clearTimeout(existingTimer);
      // Calculate remaining time based on when the timer was started
      const startedAt = timerStartedAt.get(id);
      const toast = get().toasts.find((t) => t.id === id);
      if (startedAt !== undefined && toast) {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, toast.duration - elapsed);
        set((state) => {
          const newActiveTimers = new Map(state.activeTimers);
          newActiveTimers.delete(id);
          const newTimerStartedAt = new Map(state.timerStartedAt);
          newTimerStartedAt.delete(id);
          const newRemainingTime = new Map(state.remainingTime).set(id, remaining);
          return { activeTimers: newActiveTimers, timerStartedAt: newTimerStartedAt, remainingTime: newRemainingTime };
        });
      } else {
        set((state) => {
          const newActiveTimers = new Map(state.activeTimers);
          newActiveTimers.delete(id);
          return { activeTimers: newActiveTimers };
        });
      }
    }

    set((state) => ({ pausedToasts: new Set(state.pausedToasts).add(id) }));
  },

  resumeToast: (id) => {
    const { remainingTime, toasts } = get();

    set((state) => {
      const newPausedToasts = new Set(state.pausedToasts);
      newPausedToasts.delete(id);
      return { pausedToasts: newPausedToasts };
    });

    const toast = toasts.find((t) => t.id === id);
    if (!toast || toast.duration <= 0) return;

    // Use stored remaining time if available (correct after multiple pause/resume cycles)
    const remaining = remainingTime.get(id) ?? Math.max(0, toast.duration - (Date.now() - toast.createdAt));

    if (remaining > 0) {
      const now = Date.now();
      const timerId = window.setTimeout(() => {
        get().removeToast(id);
      }, remaining) as unknown as number;

      set((state) => {
        const newRemainingTime = new Map(state.remainingTime);
        newRemainingTime.delete(id);
        return {
          activeTimers: new Map(state.activeTimers).set(id, timerId),
          timerStartedAt: new Map(state.timerStartedAt).set(id, now),
          remainingTime: newRemainingTime,
        };
      });
    }
  },

  clearAllToasts: () => {
    try {
      const { toasts, activeTimers } = get();
      activeTimers.forEach((timerId) => clearTimeout(timerId));
      toasts.forEach((toast) => toast.onDismiss?.(toast.id));
      set({
        toasts: [],
        pausedToasts: new Set(),
        activeTimers: new Map(),
        timerStartedAt: new Map(),
        remainingTime: new Map(),
      });
    } catch (error) {
      console.error('React Toast Kit: Failed to clear all toasts', error);
    }
  },

  setTheme: (theme) => {
    set({ theme });
    get().updateEffectiveTheme();
  },

  setMaxToasts: (max) => {
    set({ maxToasts: Math.max(1, max) });
  },

  updateEffectiveTheme: () => {
    const { theme } = get();
    const newEffectiveTheme = theme === 'system' ? getSystemTheme() : (theme as 'light' | 'dark');
    set({ effectiveTheme: newEffectiveTheme });
  },

  cleanup: () => {
    try {
      const { activeTimers, toasts } = get();
      activeTimers.forEach((timerId) => clearTimeout(timerId));
      toasts.forEach((toast) => toast.onDismiss?.(toast.id));
      set({
        toasts: [],
        pausedToasts: new Set(),
        activeTimers: new Map(),
        timerStartedAt: new Map(),
        remainingTime: new Map(),
      });
    } catch (error) {
      console.error('React Toast Kit: Failed to cleanup', error);
    }
  },

  registerPlugin: (plugin) => {
    set((state) => ({
      plugins: [...state.plugins.filter((p) => p.name !== plugin.name), plugin],
    }));
  },

  unregisterPlugin: (name) => {
    set((state) => ({
      plugins: state.plugins.filter((p) => p.name !== name),
    }));
  },
}));

// Single module-level media query listener — no MutationObserver to avoid memory leaks.
// Class-based dark mode toggling should be handled by setting `theme` on <ToastProvider>.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  try {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (useToastStore.getState().theme === 'system') {
        useToastStore.getState().updateEffectiveTheme();
      }
    };
    if (typeof darkModeQuery.addEventListener === 'function') {
      darkModeQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Legacy Safari <14 fallback — addListener was deprecated in favour of addEventListener
      const legacy = darkModeQuery as MediaQueryList & { addListener?: (cb: () => void) => void };
      legacy.addListener?.(handleSystemThemeChange);
    }
    // Initialize effective theme on load
    useToastStore.getState().updateEffectiveTheme();
  } catch {
    // matchMedia not fully supported — silent fallback
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const iconStrings: Record<string, string> = {
  success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Success"><path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.66669 10L9.16669 12.5L13.3334 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Error"><path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.5 7.5L7.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 7.5L12.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Warning"><path d="M8.57465 3.21667L1.51632 15C1.37079 15.2589 1.29379 15.5503 1.29298 15.8469C1.29216 16.1434 1.36756 16.4353 1.51175 16.6951C1.65593 16.9548 1.86359 17.1738 2.11656 17.3309C2.36954 17.4879 2.65908 17.5778 2.95548 17.5917H17.0721C17.3685 17.5778 17.6581 17.4879 17.9111 17.3309C18.164 17.1738 18.3717 16.9548 18.5159 16.6951C18.6601 16.4353 18.7355 16.1434 18.7347 15.8469C18.7339 15.5503 18.6569 15.2589 18.5113 15L11.453 3.21667C11.3018 2.96735 11.0893 2.7609 10.8353 2.61224C10.5813 2.46357 10.294 2.3779 10.0005 2.3646C9.7069 2.37798 9.41956 2.46374 9.16556 2.61247C8.91156 2.76121 8.69907 2.96773 8.54798 3.21708L8.57465 3.21667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 7.5V10.8333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 14.1667H10.0083" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Info"><path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 13.3333V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6.66663H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  default: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Notification"><path d="M18.3334 10C18.3334 14.6024 14.6024 18.3333 10 18.3333C5.39765 18.3333 1.66669 14.6024 1.66669 10C1.66669 5.39763 5.39765 1.66667 10 1.66667C14.6024 1.66667 18.3334 5.39763 18.3334 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 6.66667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 13.3333H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  loading: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin" role="img" aria-label="Loading"><path d="M10 3.33337V5.00004" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 15V16.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.1084 4.1084L5.2834 5.28257" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.7166 14.7167L15.8916 15.8917" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.33337 10H5.00004" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 10H16.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.1084 15.8917L5.2834 14.7167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.7166 5.28257L15.8916 4.1084" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

const createToast = (options: ToastOptions | string): string => {
  try {
    const cfg = useToastStore.getState().config;

    const base: ToastOptions = {
      duration: cfg.defaultDuration,
      dismissible: cfg.defaultDismissible,
      pauseOnHover: cfg.defaultPauseOnHover,
      dismissOnClick: cfg.defaultDismissOnClick,
      animation: cfg.defaultAnimation,
      visualStyle: cfg.defaultStyle,
      progressBarStyle: cfg.defaultProgressBarStyle,
      progressBarColor: cfg.defaultProgressBarColor,
      progressBarPosition: cfg.defaultProgressBarPosition,
      progressBarThickness: cfg.defaultProgressBarThickness,
      progressAnimation: cfg.defaultProgressAnimation,
      floating: cfg.defaultFloating,
      rippleEffect: cfg.defaultRippleEffect,
      swipeToDismiss: cfg.defaultSwipeToDismiss,
      priority: cfg.defaultPriority,
      stagger: cfg.defaultStagger,
    };

    const toastOptions: ToastOptions =
      typeof options === 'string' ? { ...base, description: options } : { ...base, ...options };

    if (cfg.globalClassName) {
      toastOptions.className = toastOptions.className
        ? `${cfg.globalClassName} ${toastOptions.className}`
        : cfg.globalClassName;
    }
    if (cfg.globalStyle) {
      toastOptions.style = { ...cfg.globalStyle, ...(toastOptions.style || {}) };
    }

    const toast: Toast = {
      id: toastOptions.id || generateId(),
      variant: toastOptions.variant || 'default',
      position: toastOptions.position || DEFAULT_POSITION,
      duration: toastOptions.duration ?? cfg.defaultDuration,
      pauseOnHover: toastOptions.pauseOnHover ?? true,
      dismissible: toastOptions.dismissible ?? true,
      dismissOnClick: toastOptions.dismissOnClick ?? false,
      theme: toastOptions.theme || DEFAULT_THEME,
      title: toastOptions.title,
      description: toastOptions.description,
      icon: toastOptions.icon,
      component: toastOptions.component,
      createdAt: Date.now(),
      onDismiss: toastOptions.onDismiss,
      className: toastOptions.className,
      style: toastOptions.style,
      animation: toastOptions.animation,
      customAnimation: toastOptions.customAnimation,
      visualStyle: toastOptions.visualStyle,
      progressBarStyle: toastOptions.progressBarStyle,
      progressBarColor: toastOptions.progressBarColor,
      progressBarPosition: toastOptions.progressBarPosition,
      progressBarThickness: toastOptions.progressBarThickness,
      floating: toastOptions.floating,
      emoji: toastOptions.emoji,
      rippleEffect: toastOptions.rippleEffect,
      stagger: toastOptions.stagger,
      swipeToDismiss: toastOptions.swipeToDismiss,
      priority: toastOptions.priority,
      progressAnimation: toastOptions.progressAnimation,
      actions: toastOptions.actions,
    };

    if (!toast.icon && !toast.emoji && toast.variant && toast.variant in iconStrings) {
      toast.iconString = iconStrings[toast.variant];
    }

    return useToastStore.getState().addToast(toast);
  } catch (error) {
    console.error('React Toast Kit: Failed to create toast', error);
    return '';
  }
};

type ToastHandler = {
  (message: string): string;
  (options: ToastOptions): string;
  success: (options: ToastOptions | string) => string;
  error: (options: ToastOptions | string) => string;
  warning: (options: ToastOptions | string) => string;
  info: (options: ToastOptions | string) => string;
  loading: (options: ToastOptions | string) => string;
  custom: (component: JSX.Element, options?: Omit<ToastOptions, 'component'>) => string;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: ToastOptions | string;
      success: ((data: T) => ToastOptions | string) | ToastOptions | string;
      error: ((error: unknown) => ToastOptions | string) | ToastOptions | string;
    }
  ) => Promise<T>;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id?: string) => void;
  clearAll: () => void;
};

const createVariantToast =
  (variant: ToastVariant) =>
  (options: ToastOptions | string): string => {
    const toastOptions = typeof options === 'string' ? { description: options } : options;
    return createToast({ ...toastOptions, variant });
  };

export const toast = ((options: ToastOptions | string) => createToast(options)) as ToastHandler;

toast.success = createVariantToast('success');
toast.error = createVariantToast('error');
toast.warning = createVariantToast('warning');
toast.info = createVariantToast('info');
toast.loading = createVariantToast('loading');

toast.custom = (component: JSX.Element, options: Omit<ToastOptions, 'component'> = {}) =>
  createToast({ ...options, component, variant: 'custom' });

toast.promise = async <T>(
  promise: Promise<T>,
  options: {
    loading: ToastOptions | string;
    success: ((data: T) => ToastOptions | string) | ToastOptions | string;
    error: ((error: unknown) => ToastOptions | string) | ToastOptions | string;
  }
): Promise<T> => {
  const loadingOpts = typeof options.loading === 'string' ? { description: options.loading } : options.loading;
  const id = createToast({ ...loadingOpts, variant: 'loading', duration: 0 });

  const defaultDuration = useToastStore.getState().config.defaultDuration;

  try {
    const data = await promise;
    const successOpts = typeof options.success === 'function' ? options.success(data) : options.success;
    toast.update(
      id,
      typeof successOpts === 'string'
        ? { description: successOpts, variant: 'success', duration: defaultDuration }
        : { ...successOpts, variant: 'success', duration: successOpts.duration ?? defaultDuration }
    );
    return data;
  } catch (error) {
    const errorOpts = typeof options.error === 'function' ? options.error(error) : options.error;
    toast.update(
      id,
      typeof errorOpts === 'string'
        ? { description: errorOpts, variant: 'error', duration: defaultDuration }
        : { ...errorOpts, variant: 'error', duration: errorOpts.duration ?? defaultDuration }
    );
    throw error;
  }
};

toast.update = (id: string, options: Partial<ToastOptions>) => {
  try {
    const existing = useToastStore.getState().toasts.find((t) => t.id === id);
    if (existing?.variant === 'loading' && options.variant && options.variant !== 'loading' && !options.duration) {
      options.duration = useToastStore.getState().config.defaultDuration;
    }
    useToastStore.getState().updateToast(id, options as Partial<Toast>);
  } catch (error) {
    console.error('React Toast Kit: Failed to update toast', error);
  }
};

toast.dismiss = (id?: string) => {
  if (id) {
    useToastStore.getState().removeToast(id);
  } else {
    useToastStore.getState().clearAllToasts();
  }
};

toast.clearAll = () => {
  useToastStore.getState().clearAllToasts();
};

export const registerPlugin = (plugin: ToastPlugin) => {
  useToastStore.getState().registerPlugin(plugin);
};

export const unregisterPlugin = (name: string) => {
  useToastStore.getState().unregisterPlugin(name);
};

export const cleanup = () => {
  useToastStore.getState().cleanup();
};

export const toastDevTools = {
  show: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('react-toast-kit:devtools:show'));
    }
  },
  hide: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('react-toast-kit:devtools:hide'));
    }
  },
  toggle: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('react-toast-kit:devtools:toggle'));
    }
  },
  getToasts: () => useToastStore.getState().toasts,
  ...(typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
    ? {
        getActiveToasts: () => useToastStore.getState().toasts,
        clearAll: () => useToastStore.getState().clearAllToasts(),
        debugInfo: () => {
          const state = useToastStore.getState();
          /* eslint-disable no-console */
          console.group('React Toast Kit Debug Info');
          console.table(
            state.toasts.map((t) => ({
              id: t.id,
              variant: t.variant,
              position: t.position,
              duration: t.duration,
              priority: t.priority,
              createdAt: new Date(t.createdAt).toLocaleTimeString(),
            }))
          );
          console.log('Theme:', state.theme, '| Effective:', state.effectiveTheme);
          console.log('Paused toasts:', Array.from(state.pausedToasts));
          console.log('Active timers:', state.activeTimers.size);
          console.log('Registered plugins:', state.plugins.map((p) => p.name));
          console.groupEnd();
          /* eslint-enable no-console */
        },
        getStore: () => useToastStore.getState(),
        simulateError: () => toast.error('Test error toast for debugging'),
        simulateSuccess: () => toast.success('Test success toast for debugging'),
      }
    : {}),
};
