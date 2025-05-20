import { JSX, useEffect } from 'react';
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
  // Styling options
  className?: string;         // Additional CSS class for custom styling
  style?: React.CSSProperties; // Inline styles for the toast
  animation?: 'slide' | 'fade' | 'bounce' | 'none'; // Animation style
}

export interface Toast extends Required<Pick<ToastOptions, 'id' | 'variant' | 'position' | 'duration' | 'pauseOnHover' | 'dismissible' | 'dismissOnClick' | 'theme'>> {
  title?: string;
  description?: string;
  icon?: JSX.Element;
  component?: JSX.Element;
  createdAt: number;
  onDismiss?: (id: string) => void;
  // Additional fields from options
  className?: string;
  style?: React.CSSProperties;
  animation?: 'slide' | 'fade' | 'bounce' | 'none';
  // Internal properties
  iconString?: string;
  updating?: boolean;
}

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark'; // The actual theme (light/dark) after resolving system preference
  pausedToasts: Set<string>;
  addToast: (toast: Toast) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  clearAllToasts: () => void;
  setTheme: (theme: ToastTheme) => void;
  setMaxToasts: (max: number) => void;
  updateEffectiveTheme: () => void;
}

// Default values - these can be overridden by ToastProvider props
const DEFAULT_DURATION = 4000;
const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_THEME: ToastTheme = 'system';
const DEFAULT_MAX_TOASTS = 3;

// Function to detect system dark mode preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  // Check for dark mode class on document (for frameworks like Next.js with className)
  if (document.documentElement.classList.contains('dark')) return 'dark';
  
  // Check for prefers-color-scheme media query
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Function to get configured values from ToastProvider or fallback to defaults
const getConfigValue = <T,>(key: string, defaultValue: T): T => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // Access the config exposed by ToastProvider
    const config = (window as any).__TOAST_CONFIG__;
    
    if (config && key in config) {
      return config[key] as T;
    }
  }
  
  return defaultValue;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  maxToasts: DEFAULT_MAX_TOASTS,
  theme: DEFAULT_THEME,
  effectiveTheme: getSystemTheme(),
  pausedToasts: new Set<string>(),
  
  addToast: (toast) => {
    const { toasts, maxToasts } = get();
    
    // If we have reached the max number of toasts, remove the oldest
    if (toasts.length >= maxToasts) {
      const oldestToast = [...toasts].sort((a, b) => a.createdAt - b.createdAt)[0];
      if (oldestToast) {
        get().removeToast(oldestToast.id);
      }
    }
    
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return toast.id;
  },
  
  removeToast: (id) => {
    const toast = get().toasts.find(t => t.id === id);
    if (toast?.onDismiss) {
      toast.onDismiss(id);
    }
    set((state) => ({ 
      toasts: state.toasts.filter((t) => t.id !== id),
      pausedToasts: new Set([...state.pausedToasts].filter(i => i !== id))
    }));
  },
  
  updateToast: (id, updatedToast) => {
    set((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...updatedToast, updating: true } : t))
    }));
    
    // After a short delay, remove the updating flag for animation
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((t) => (t.id === id ? { ...t, updating: false } : t))
      }));
    }, 100);
  },
  
  pauseToast: (id) => {
    set((state) => ({
      pausedToasts: new Set(state.pausedToasts).add(id)
    }));
  },
  
  resumeToast: (id) => {
    set((state) => {
      const newPausedToasts = new Set(state.pausedToasts);
      newPausedToasts.delete(id);
      return { pausedToasts: newPausedToasts };
    });
  },
  
  clearAllToasts: () => {
    // Call onDismiss handlers before clearing
    get().toasts.forEach(toast => {
      if (toast.onDismiss) {
        toast.onDismiss(toast.id);
      }
    });
    
    set({ toasts: [], pausedToasts: new Set() });
  },
  
  setTheme: (theme) => {
    set({ theme });
    get().updateEffectiveTheme();
  },
  
  setMaxToasts: (max) => set({ maxToasts: max }),
  
  updateEffectiveTheme: () => {
    const { theme } = get();
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;
    set({ effectiveTheme });
    
    // Set data-theme attribute on document for CSS variable targeting
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-toast-theme', effectiveTheme);
    }
  }
}));

// Set up media query listener to respond to system theme changes
if (typeof window !== 'undefined') {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Initial update
  useToastStore.getState().updateEffectiveTheme();
  
  // Listen for changes
  if (darkModeMediaQuery.addEventListener) {
    darkModeMediaQuery.addEventListener('change', () => {
      if (useToastStore.getState().theme === 'system') {
        useToastStore.getState().updateEffectiveTheme();
      }
    });
  } else if ('matchMedia' in window) {
    // Fallback for older browsers
    window.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
      if (useToastStore.getState().theme === 'system') {
        useToastStore.getState().updateEffectiveTheme();
      }
    });
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Define icon SVG strings
const iconStrings = {
  success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.66669 10L9.16669 12.5L13.3334 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 7.5L7.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7.5 7.5L12.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.57465 3.21667L1.51632 15C1.37079 15.2589 1.29379 15.5503 1.29298 15.8469C1.29216 16.1434 1.36756 16.4353 1.51175 16.6951C1.65593 16.9548 1.86359 17.1738 2.11656 17.3309C2.36954 17.4879 2.65908 17.5778 2.95548 17.5917H17.0721C17.3685 17.5778 17.6581 17.4879 17.9111 17.3309C18.164 17.1738 18.3717 16.9548 18.5159 16.6951C18.6601 16.4353 18.7355 16.1434 18.7347 15.8469C18.7339 15.5503 18.6569 15.2589 18.5113 15L11.453 3.21667C11.3018 2.96735 11.0893 2.7609 10.8353 2.61224C10.5813 2.46357 10.294 2.3779 10.0005 2.3646C9.7069 2.37798 9.41956 2.46374 9.16556 2.61247C8.91156 2.76121 8.69907 2.96773 8.54798 3.21708L8.57465 3.21667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 7.5V10.8333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 14.1667H10.0083" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 13.3333V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 6.66663H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  default: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.3334 10C18.3334 14.6024 14.6024 18.3333 10 18.3333C5.39765 18.3333 1.66669 14.6024 1.66669 10C1.66669 5.39763 5.39765 1.66667 10 1.66667C14.6024 1.66667 18.3334 5.39763 18.3334 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 6.66667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 13.3333H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  loading: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin">
    <path d="M10 3.33337V5.00004" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 15V16.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.1084 4.1084L5.2834 5.28257" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.7166 14.7167L15.8916 15.8917" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.33337 10H5.00004" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 10H16.6667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4.1084 15.8917L5.2834 14.7167" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M14.7166 5.28257L15.8916 4.1084" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

const createToast = (options: ToastOptions | string): string => {
  // Get defaults from ToastProvider configuration or fallback to hardcoded defaults
  const configuredDefaults = {
    duration: getConfigValue('defaultDuration', DEFAULT_DURATION),
    position: getConfigValue('defaultPosition', DEFAULT_POSITION),
    theme: getConfigValue('defaultTheme', useToastStore.getState().theme),
  };
  
  const defaultOptions: ToastOptions = {
    variant: 'default',
    duration: configuredDefaults.duration,
    position: configuredDefaults.position,
    dismissible: true,
    pauseOnHover: true,
    dismissOnClick: false,
    theme: configuredDefaults.theme,
    animation: 'slide',
  };
  
  // Handle string case
  let toastOptions: ToastOptions = typeof options === 'string' 
    ? { description: options } 
    : options;
    
  // Add iconString property for later conversion to icon in ToastProvider
  const variant = toastOptions.variant || defaultOptions.variant;
  if (!toastOptions.icon && variant !== 'custom') {
    if (variant && variant in iconStrings) {
      (toastOptions as any).iconString = iconStrings[variant as keyof typeof iconStrings];
    }
  }
  // For loading variant, set infinite duration by default if not specified
  if (variant === 'loading' && toastOptions.duration === undefined) {
    toastOptions.duration = 0; // Infinite
  }
  
  // Create toast with defaults + provided options
  const toast: Toast = {
    ...defaultOptions,
    ...toastOptions,
    id: toastOptions.id || generateId(),
    createdAt: Date.now(),
  } as Toast;
  
  return useToastStore.getState().addToast(toast);
};

type ToastHandler = {
  (options: ToastOptions | string): string;
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
      error: ((error: any) => ToastOptions | string) | ToastOptions | string;
    }
  ) => Promise<T>;
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id?: string) => void;
  clearAll: () => void;
};

const createVariantToast = (variant: ToastVariant) => (options: ToastOptions | string): string => {
  const toastOptions = typeof options === 'string' ? { description: options } : options;
  return createToast({ ...toastOptions, variant });
};

export const toast = ((options: ToastOptions | string) => createToast(options)) as ToastHandler;
toast.success = createVariantToast('success');
toast.error = createVariantToast('error');
toast.warning = createVariantToast('warning');
toast.info = createVariantToast('info');
toast.loading = createVariantToast('loading');
toast.custom = (component: JSX.Element, options: Omit<ToastOptions, 'component'> = {}) => {
  return createToast({ ...options, component, variant: 'custom' });
};

toast.promise = async <T>(
  promise: Promise<T>,
  options: {
    loading: ToastOptions | string;
    success: ((data: T) => ToastOptions | string) | ToastOptions | string;
    error: ((error: any) => ToastOptions | string) | ToastOptions | string;
  }
): Promise<T> => {
  // Create loading toast
  const id = createToast({
    ...((typeof options.loading === 'string') ? { description: options.loading } : options.loading),
    variant: 'loading',
    duration: 0, // Use infinite duration for loading toasts
  });
  try {
    const data = await promise;
    
    // Process success options based on type
    let successOptions: ToastOptions | string;
    if (typeof options.success === 'function') {
      successOptions = options.success(data);
    } else {
      successOptions = options.success;
    }
    
    // Update toast with success state
    toast.update(
      id,
      typeof successOptions === 'string' 
        ? { description: successOptions, variant: 'success', duration: DEFAULT_DURATION } 
        : { ...successOptions, variant: 'success', duration: successOptions.duration || DEFAULT_DURATION }
    );
    
    return data;
  } catch (error) {
    // Process error options based on type
    let errorOptions: ToastOptions | string;
    if (typeof options.error === 'function') {
      errorOptions = options.error(error);
    } else {
      errorOptions = options.error;
    }
    
    // Update toast with error state
    toast.update(
      id,
      typeof errorOptions === 'string' 
        ? { description: errorOptions, variant: 'error', duration: DEFAULT_DURATION } 
        : { ...errorOptions, variant: 'error', duration: errorOptions.duration || DEFAULT_DURATION }
    );
    
    throw error;
  }
};

toast.update = (id: string, options: Partial<ToastOptions>) => {
  // If updating a loading toast to a different variant but duration isn't specified,
  // we should use the default duration as loading toasts have infinite duration by default
  const existingToast = useToastStore.getState().toasts.find(t => t.id === id);
  if (existingToast && existingToast.variant === 'loading' && options.variant && options.variant !== 'loading' && !options.duration) {
    options.duration = DEFAULT_DURATION;
  }
  
  useToastStore.getState().updateToast(id, options as Partial<Toast>);
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

// Custom hook for detecting theme changes
export function useThemeDetector() {
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handler = () => {
      if (useToastStore.getState().theme === 'system') {
        useToastStore.getState().updateEffectiveTheme();
      }
    };
    
    darkModeMediaQuery.addEventListener('change', handler);
    
    // Initial update
    handler();
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handler);
    };
  }, []);
  
  return useToastStore(state => state.effectiveTheme);
}