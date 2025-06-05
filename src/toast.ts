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
export type ToastAnimation = 'slide' | 'fade' | 'bounce' | 'flip' | 'zoom' | 'none';
export type ToastStyle = 'solid' | 'gradient' | 'glass' | 'shimmer' | 'pill' | 'neon' | 'retro' | 'confetti';

// Enhanced progress bar styles
export type ProgressBarStyle = 
  | 'default'           // Standard progress bar
  | 'fancy'             // Similar to react-toastify
  | 'gradient-wave'     // Animated gradient that moves with the progress
  | 'pulse'             // Pulsating progress bar
  | 'particles'         // Small particles moving along the progress bar
  | 'liquid'            // Fluid-like animation
  | 'three-d'           // Progress bar with depth effect (renamed from '3d')
  | 'dashed'            // Dashed/dotted line progress
  | 'glow'              // Glowing effect that follows progress
  | 'rainbow'           // Rainbow color animation
  | 'data-flow'         // Digital data flow animation
  | 'step-progress';    // Step-by-step completion indicators

// Enhanced interface for custom animations
export interface CustomAnimation {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit: Record<string, unknown>;
  transition?: Record<string, unknown>;
}

// Plugin interface for extensibility
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
  // Styling options
  className?: string;
  style?: React.CSSProperties;
  animation?: ToastAnimation;
  customAnimation?: CustomAnimation; // New: Support for custom animations
  visualStyle?: ToastStyle;
  progressBarStyle?: ProgressBarStyle;
  progressBarColor?: string; // Custom color for progress bar
  progressBarPosition?: 'top' | 'bottom' | 'left' | 'right'; // Position of progress bar
  progressBarThickness?: number; // Thickness of progress bar in pixels
  floating?: boolean;
  emoji?: string;
  rippleEffect?: boolean;
  // New: Advanced options
  stagger?: number; // Delay between multiple toasts
  swipeToDismiss?: boolean; // Enable swipe to dismiss on mobile
  priority?: 'low' | 'normal' | 'high'; // Toast priority
  progressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
}

// Strict version for better type safety
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
  // Additional fields from options
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
  // Internal properties
  iconString?: string;
  updating?: boolean;
  timerId?: number; // Track timer for cleanup
}

interface ToastState {
  toasts: Toast[];
  maxToasts: number;
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  pausedToasts: Set<string>;
  activeTimers: Map<string, number>; // Track active timers
  plugins: ToastPlugin[]; // Registered plugins
  addToast: (toast: Toast) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<Toast>) => void;
  pauseToast: (id: string) => void;
  resumeToast: (id: string) => void;
  clearAllToasts: () => void;
  setTheme: (theme: ToastTheme) => void;
  setMaxToasts: (max: number) => void;
  updateEffectiveTheme: () => void;
  cleanup: () => void; // Cleanup function
  registerPlugin: (plugin: ToastPlugin) => void;
  unregisterPlugin: (name: string) => void;
}

// Default values
const DEFAULT_DURATION = 4000;
const DEFAULT_POSITION: ToastPosition = 'top-right';
const DEFAULT_THEME: ToastTheme = 'system';
const DEFAULT_MAX_TOASTS = 3;
const DEFAULT_ANIMATION: ToastAnimation = 'slide';
const DEFAULT_STYLE: ToastStyle = 'solid';
// const DEFAULT_PROGRESS_STYLE: ProgressBarStyle = 'default';
// const DEFAULT_PROGRESS_POSITION = 'bottom';
// const DEFAULT_PROGRESS_THICKNESS = 3;
// const DEFAULT_PROGRESS_ANIMATION = 'linear';

// Enhanced system theme detection with better error handling and fallback
const getSystemTheme = (): 'light' | 'dark' => {
  // Handle SSR
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'; // Safe default for SSR
  }

  try {
    // Try the standard media query first
    const standardQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (standardQuery.matches) return 'dark';

    // Try alternative methods for older browsers or special cases
    
    // iOS/Safari specific detection
    const iosDarkQuery = window.matchMedia('(-apple-system-interface-style: dark)');
    if (iosDarkQuery.matches) return 'dark';

    // Check for dark mode classes on html/body (common pattern)
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    
    if (
      htmlEl?.classList.contains('dark') || 
      bodyEl?.classList.contains('dark') ||
      htmlEl?.classList.contains('theme-dark') ||
      bodyEl?.classList.contains('theme-dark') ||
      htmlEl?.dataset.theme === 'dark' ||
      bodyEl?.dataset.theme === 'dark'
    ) {
      return 'dark';
    }
    
    // Check for CSS variables that might indicate dark mode
    if (typeof window.getComputedStyle === 'function') {
      const bodyStyles = window.getComputedStyle(document.body);
      const htmlStyles = window.getComputedStyle(document.documentElement);
      
      const bgColor = bodyStyles.backgroundColor || htmlStyles.backgroundColor || '';
      
      // Simple heuristic: if background is dark, probably dark mode
      if (bgColor) {
        const rgb = bgColor.match(/\d+/g)?.map(Number);
        if (rgb && rgb.length >= 3) {
          // Calculate luminance - if low, likely dark mode
          const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
          if (luminance < 0.5) return 'dark';
        }
      }
    }
    
    // Default to light mode if all detection methods fail
    return 'light';
  } catch (error) {
    console.warn('React Toast Kit: Error detecting system theme, falling back to light mode', error);
    return 'light';
  }
};

// Enhanced config value retrieval with validation
const getConfigValue = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const config = (window as any).__TOAST_CONFIG__;
    if (config && typeof config === 'object' && key in config) {
      return config[key];
    }
  } catch (error) {
    console.warn(`React Toast Kit: Failed to get config value for ${key}`, error);
  }
  
  return defaultValue;
};

// Configuration validation
// const validateConfig = (config: Record<string, unknown>): Record<string, unknown> => {
//   if (config.maxToasts && typeof config.maxToasts === 'number' && config.maxToasts < 1) {
//     console.warn('React Toast Kit: maxToasts should be at least 1, setting to 1');
//     config.maxToasts = 1;
//   }
  
//   if (config.defaultDuration && typeof config.defaultDuration === 'number' && config.defaultDuration < 0) {
//     console.warn('React Toast Kit: defaultDuration should be positive, setting to 4000ms');
//     config.defaultDuration = 4000;
//   }
  
//   return config;
// };

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  maxToasts: DEFAULT_MAX_TOASTS,
  theme: DEFAULT_THEME,
  effectiveTheme: getSystemTheme(),
  pausedToasts: new Set<string>(),
  activeTimers: new Map<string, number>(),
  plugins: [],
  
  addToast: (toast) => {
    try {
      const { toasts, maxToasts, plugins, activeTimers, pausedToasts } = get();
      
      // Create a complete Toast object with all required fields 
      // before passing to plugins (this fixes the TypeScript error)
      let processedToast: Toast = toast;
      
      // Run beforeCreate plugins
      plugins.forEach(plugin => {
        if (plugin.beforeCreate) {
          // Process the toast and ensure it still has all required properties
          const result = plugin.beforeCreate(processedToast);
          
          // Safely merge styles
          let mergedStyle: React.CSSProperties | undefined;
          if (result.style || processedToast.style) {
            mergedStyle = {
              ...(processedToast.style || {}),
              ...(result.style || {})
            };
          }
          
          // Create a new toast object with merged properties
          processedToast = {
            id: result.id || processedToast.id,
            variant: result.variant || processedToast.variant,
            position: result.position || processedToast.position,
            duration: result.duration !== undefined ? result.duration : processedToast.duration,
            pauseOnHover: result.pauseOnHover !== undefined ? result.pauseOnHover : processedToast.pauseOnHover,
            dismissible: result.dismissible !== undefined ? result.dismissible : processedToast.dismissible,
            dismissOnClick: result.dismissOnClick !== undefined ? result.dismissOnClick : processedToast.dismissOnClick,
            theme: result.theme || processedToast.theme,
            createdAt: processedToast.createdAt,
            title: result.title || processedToast.title,
            description: result.description || processedToast.description,
            icon: result.icon || processedToast.icon,
            component: result.component || processedToast.component,
            onDismiss: result.onDismiss || processedToast.onDismiss,
            className: result.className || processedToast.className,
            style: mergedStyle,
            animation: result.animation || processedToast.animation,
            customAnimation: result.customAnimation || processedToast.customAnimation,
            visualStyle: result.visualStyle || processedToast.visualStyle,
            progressBarStyle: result.progressBarStyle || processedToast.progressBarStyle,
            progressBarColor: result.progressBarColor || processedToast.progressBarColor,
            progressBarPosition: result.progressBarPosition || processedToast.progressBarPosition,
            progressBarThickness: result.progressBarThickness || processedToast.progressBarThickness,
            floating: result.floating !== undefined ? result.floating : processedToast.floating,
            emoji: result.emoji || processedToast.emoji,
            rippleEffect: result.rippleEffect !== undefined ? result.rippleEffect : processedToast.rippleEffect,
            stagger: result.stagger !== undefined ? result.stagger : processedToast.stagger,
            swipeToDismiss: result.swipeToDismiss !== undefined ? result.swipeToDismiss : processedToast.swipeToDismiss,
            priority: result.priority || processedToast.priority,
            progressAnimation: result.progressAnimation || processedToast.progressAnimation,
            iconString: processedToast.iconString,
            updating: processedToast.updating,
            timerId: processedToast.timerId,
          };
        }
      });
      
      // Priority-based insertion
      let insertIndex = toasts.length;
      if (processedToast.priority === 'high') {
        insertIndex = 0;
      } else if (processedToast.priority === 'normal') {
        // Find the first low priority toast
        const lowPriorityIndex = toasts.findIndex(t => t.priority === 'low');
        if (lowPriorityIndex !== -1) {
          insertIndex = lowPriorityIndex;
        }
      }
      
      // Remove oldest if at capacity
      if (toasts.length >= maxToasts) {
        // Find the oldest toast that isn't the current one
        const oldestToast = [...toasts]
          .sort((a, b) => a.createdAt - b.createdAt)
          .find(t => t.id !== processedToast.id);
          
        if (oldestToast) {
          get().removeToast(oldestToast.id);
        }
      }
      
      // Add toast to state
      const updatedToasts = [...toasts];
      updatedToasts.splice(insertIndex, 0, processedToast);
      set({ toasts: updatedToasts });
      
      // Set up timer for auto-dismiss if duration is set and toast is not paused
      if (processedToast.duration && processedToast.duration > 0 && !pausedToasts.has(processedToast.id)) {
        // Clear any existing timer for this toast
        const existingTimer = activeTimers.get(processedToast.id);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Create new timer
        const timerId = window.setTimeout(() => {
          get().removeToast(processedToast.id);
        }, processedToast.duration) as unknown as number;
        
        // Store timer reference
        set(state => ({
          activeTimers: new Map(state.activeTimers).set(processedToast.id, timerId)
        }));
      }
      
      // Run afterCreate plugins
      plugins.forEach(plugin => {
        if (plugin.afterCreate) {
          plugin.afterCreate(processedToast);
        }
      });
      
      // Add stagger delay if specified
      if (processedToast.stagger && processedToast.stagger > 0) {
        setTimeout(() => {
          // Returning ID after stagger
        }, processedToast.stagger);
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
      const toast = toasts.find(t => t.id === id);
      
      if (!toast) return;
      
      // Run beforeRemove plugins
      let shouldRemove = true;
      plugins.forEach(plugin => {
        if (plugin.beforeRemove && plugin.beforeRemove(toast) === false) {
          shouldRemove = false;
        }
      });
      
      if (!shouldRemove) return;
      
      // Clear timer if exists
      const timerId = activeTimers.get(id);
      if (timerId) {
        clearTimeout(timerId);
      }
      
      // Call onDismiss handler
      if (toast.onDismiss) {
        toast.onDismiss(id);
      }
      
      set((state) => ({ 
        toasts: state.toasts.filter((t) => t.id !== id),
        pausedToasts: new Set([...state.pausedToasts].filter(i => i !== id)),
        activeTimers: new Map([...state.activeTimers].filter(([key]) => key !== id))
      }));
      
      // Run afterRemove plugins
      plugins.forEach(plugin => {
        if (plugin.afterRemove) {
          plugin.afterRemove(toast);
        }
      });
    } catch (error) {
      console.error('React Toast Kit: Failed to remove toast', error);
    }
  },
  
  updateToast: (id, updatedToast) => {
    try {
      const { activeTimers } = get();
      // Update the toast in state
      set((state) => ({
        toasts: state.toasts.map((t) => {
          if (t.id === id) {
            const updated = { ...t, ...updatedToast, updating: true };
            
            // If duration changed and there's an active timer, reset it
            if (updatedToast.duration !== undefined && updated.duration !== t.duration) {
              // Clear existing timer
              const existingTimer = activeTimers.get(id);
              if (existingTimer) {
                clearTimeout(existingTimer);
              }
              
              // Set up new timer if duration is positive and toast isn't paused
              if (updated.duration > 0 && !state.pausedToasts.has(id)) {
                const newTimerId = window.setTimeout(() => {
                  get().removeToast(id);
                }, updated.duration) as unknown as number;
                
                // Update the timer map after the state update completes
                setTimeout(() => {
                  set(state => ({
                    activeTimers: new Map(state.activeTimers).set(id, newTimerId)
                  }));
                }, 0);
              }
            }
            
            return updated;
          }
          return t;
        })
      }));
      
      // Clear updating flag after animation
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.map((t) => 
            t.id === id ? { ...t, updating: false } : t
          )
        }));
      }, 100);
    } catch (error) {
      console.error('React Toast Kit: Failed to update toast', error);
    }
  },
  
  pauseToast: (id) => {
    const { activeTimers } = get();
    // Clear the existing timer if there is one
    const existingTimer = activeTimers.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      
      // Update active timers map to remove this timer
      set(state => {
        const newTimers = new Map(state.activeTimers);
        newTimers.delete(id);
        return { activeTimers: newTimers };
      });
    }
    
    set((state) => ({
      pausedToasts: new Set(state.pausedToasts).add(id)
    }));
  },
  
  resumeToast: (id) => {
    const { toasts } = get();
    // Remove from paused set
    set((state) => {
      const newPausedToasts = new Set(state.pausedToasts);
      newPausedToasts.delete(id);
      return { pausedToasts: newPausedToasts };
    });
    
    // Restart the timer if toast has a duration
    const toast = toasts.find(t => t.id === id);
    if (toast && toast.duration && toast.duration > 0) {
      // Calculate remaining time based on creation time and elapsed time
      const elapsed = Date.now() - toast.createdAt;
      const remaining = Math.max(0, toast.duration - elapsed);
      
      // Create new timer with remaining time
      const timerId = window.setTimeout(() => {
        get().removeToast(id);
      }, remaining) as unknown as number;
      
      // Store timer reference
      set(state => ({
        activeTimers: new Map(state.activeTimers).set(id, timerId)
      }));
    }
  },
  
  clearAllToasts: () => {
    try {
      const { toasts, activeTimers } = get();
      
      // Clear all timers
      activeTimers.forEach(timerId => clearTimeout(timerId));
      
      // Call onDismiss handlers
      toasts.forEach(toast => {
        if (toast.onDismiss) {
          toast.onDismiss(toast.id);
        }
      });
      
      set({ 
        toasts: [], 
        pausedToasts: new Set(),
        activeTimers: new Map()
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
    const validatedMax = Math.max(1, max); // Ensure at least 1
    set({ maxToasts: validatedMax });
  },
  
  updateEffectiveTheme: () => {
    const { theme } = get();
    
    let newEffectiveTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      newEffectiveTheme = getSystemTheme();
    } else {
      newEffectiveTheme = theme as 'light' | 'dark';
    }
    
    set({ effectiveTheme: newEffectiveTheme });
  },
  
  cleanup: () => {
    try {
      const { activeTimers, toasts } = get();
      
      // Clear all active timers
      activeTimers.forEach(timerId => clearTimeout(timerId));
      
      // Call onDismiss for all toasts
      toasts.forEach(toast => {
        if (toast.onDismiss) {
          toast.onDismiss(toast.id);
        }
      });
      
      set({ 
        toasts: [], 
        pausedToasts: new Set(),
        activeTimers: new Map()
      });
    } catch (error) {
      console.error('React Toast Kit: Failed to cleanup', error);
    }
  },
  
  registerPlugin: (plugin) => {
    try {
      set((state) => ({
        plugins: [...state.plugins.filter(p => p.name !== plugin.name), plugin]
      }));
    } catch (error) {
      console.error('React Toast Kit: Failed to register plugin', error);
    }
  },
  
  unregisterPlugin: (name) => {
    try {
      set((state) => ({
        plugins: state.plugins.filter(p => p.name !== name)
      }));
    } catch (error) {
      console.error('React Toast Kit: Failed to unregister plugin', error);
    }
  }
}));

// Setup media query listener in a safe way that doesn't interfere with React hooks
let mediaQuerySetup = false;

const setupMediaQueryListener = () => {
  if (mediaQuerySetup || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }
  
  try {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Modern browsers
    if (typeof darkModeQuery.addEventListener === 'function') {
      darkModeQuery.addEventListener('change', () => {
        const { theme } = useToastStore.getState();
        if (theme === 'system') {
          useToastStore.getState().updateEffectiveTheme();
        }
      });
    } 
    // Older browsers
    else if (typeof darkModeQuery.addListener === 'function') {
      darkModeQuery.addListener(() => {
        const { theme } = useToastStore.getState();
        if (theme === 'system') {
          useToastStore.getState().updateEffectiveTheme();
        }
      });
    }
    
    // Handle iOS Safari
    try {
      const iosDarkQuery = window.matchMedia('(-apple-system-interface-style: dark)');
      if (typeof iosDarkQuery.addEventListener === 'function') {
        iosDarkQuery.addEventListener('change', () => {
          const { theme } = useToastStore.getState();
          if (theme === 'system') {
            useToastStore.getState().updateEffectiveTheme();
          }
        });
      }
    } catch (e) {
      // iOS query not supported, ignore
    }
    
    // Watch for class changes on html/body
    if (typeof MutationObserver === 'function') {
      const htmlObserver = new MutationObserver(() => {
        const { theme } = useToastStore.getState();
        if (theme === 'system') {
          useToastStore.getState().updateEffectiveTheme();
        }
      });
      
      htmlObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
      });
      
      const bodyObserver = new MutationObserver(() => {
        const { theme } = useToastStore.getState();
        if (theme === 'system') {
          useToastStore.getState().updateEffectiveTheme();
        }
      });
      
      if (document.body) {
        bodyObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'data-theme']
        });
      }
    }
    
    mediaQuerySetup = true;
  } catch (error) {
    console.warn('React Toast Kit: Error setting up theme change listeners', error);
  }
};

// Only setup when needed, not at module level
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMediaQueryListener);
  } else {
    setupMediaQueryListener();
  }
  
  // Initialize effective theme
  useToastStore.getState().updateEffectiveTheme();
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Enhanced icon strings with better SVG structure
const iconStrings = {
  success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Success">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6.66669 10L9.16669 12.5L13.3334 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Error">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12.5 7.5L7.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M7.5 7.5L12.5 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Warning">
    <path d="M8.57465 3.21667L1.51632 15C1.37079 15.2589 1.29379 15.5503 1.29298 15.8469C1.29216 16.1434 1.36756 16.4353 1.51175 16.6951C1.65593 16.9548 1.86359 17.1738 2.11656 17.3309C2.36954 17.4879 2.65908 17.5778 2.95548 17.5917H17.0721C17.3685 17.5778 17.6581 17.4879 17.9111 17.3309C18.164 17.1738 18.3717 16.9548 18.5159 16.6951C18.6601 16.4353 18.7355 16.1434 18.7347 15.8469C18.7339 15.5503 18.6569 15.2589 18.5113 15L11.453 3.21667C11.3018 2.96735 11.0893 2.7609 10.8353 2.61224C10.5813 2.46357 10.294 2.3779 10.0005 2.3646C9.7069 2.37798 9.41956 2.46374 9.16556 2.61247C8.91156 2.76121 8.69907 2.96773 8.54798 3.21708L8.57465 3.21667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 7.5V10.8333" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 14.1667H10.0083" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Info">
    <path d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 13.3333V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 6.66663H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  default: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Notification">
    <path d="M18.3334 10C18.3334 14.6024 14.6024 18.3333 10 18.3333C5.39765 18.3333 1.66669 14.6024 1.66669 10C1.66669 5.39763 5.39765 1.66667 10 1.66667C14.6024 1.66667 18.3334 5.39763 18.3334 10Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 6.66667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10 13.3333H10.0083" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  loading: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="animate-spin" role="img" aria-label="Loading">
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

// Enhanced toast creation with better error handling
const createToast = (options: ToastOptions | string): string => {
  try {
    let toastOptions: ToastOptions;
    
    if (typeof options === 'string') {
      toastOptions = { 
        description: options,
        // Apply defaults from provider
        duration: getConfigValue('defaultDuration', DEFAULT_DURATION),
        dismissible: getConfigValue('defaultDismissible', true),
        pauseOnHover: getConfigValue('defaultPauseOnHover', true),
        dismissOnClick: getConfigValue('defaultDismissOnClick', false),
        animation: getConfigValue('defaultAnimation', DEFAULT_ANIMATION),
        visualStyle: getConfigValue('defaultStyle', DEFAULT_STYLE),
        progressBarStyle: getConfigValue('defaultProgressBarStyle', undefined),
        progressBarColor: getConfigValue('defaultProgressBarColor', undefined),
        progressBarPosition: getConfigValue('defaultProgressBarPosition', 'bottom'),
        progressBarThickness: getConfigValue('defaultProgressBarThickness', 3),
        progressAnimation: getConfigValue('defaultProgressAnimation', 'linear'),
        floating: getConfigValue('defaultFloating', false),
        rippleEffect: getConfigValue('defaultRippleEffect', false),
        swipeToDismiss: getConfigValue('defaultSwipeToDismiss', false),
        priority: getConfigValue('defaultPriority', 'normal'),
        stagger: getConfigValue('defaultStagger', 0),
      };
    } else {
      toastOptions = {
        // Apply defaults first, then override with provided options
        duration: getConfigValue('defaultDuration', DEFAULT_DURATION),
        dismissible: getConfigValue('defaultDismissible', true),
        pauseOnHover: getConfigValue('defaultPauseOnHover', true),
        dismissOnClick: getConfigValue('defaultDismissOnClick', false),
        animation: getConfigValue('defaultAnimation', DEFAULT_ANIMATION),
        visualStyle: getConfigValue('defaultStyle', DEFAULT_STYLE),
        progressBarStyle: getConfigValue('defaultProgressBarStyle', undefined),
        progressBarColor: getConfigValue('defaultProgressBarColor', undefined),
        progressBarPosition: getConfigValue('defaultProgressBarPosition', 'bottom'),
        progressBarThickness: getConfigValue('defaultProgressBarThickness', 3),
        progressAnimation: getConfigValue('defaultProgressAnimation', 'linear'),
        floating: getConfigValue('defaultFloating', false),
        rippleEffect: getConfigValue('defaultRippleEffect', false),
        swipeToDismiss: getConfigValue('defaultSwipeToDismiss', false),
        priority: getConfigValue('defaultPriority', 'normal'),
        stagger: getConfigValue('defaultStagger', 0),
        ...options, // User options override defaults
      };
    }

    // Apply global styles if configured
    const globalClassName = getConfigValue('globalClassName', undefined);
    const globalStyle = getConfigValue('globalStyle', undefined);
    
    if (globalClassName) {
      toastOptions.className = toastOptions.className 
        ? `${globalClassName} ${toastOptions.className}`
        : globalClassName;
    }
    
    if (globalStyle && typeof globalStyle === 'object') {
      toastOptions.style = {
        ...(globalStyle as React.CSSProperties),
        ...(toastOptions.style || {}),
      };
    }

    const toast: Toast = {
      id: toastOptions.id || generateId(),
      variant: toastOptions.variant || 'default',
      position: toastOptions.position || DEFAULT_POSITION,
      duration: toastOptions.duration !== undefined ? toastOptions.duration : DEFAULT_DURATION,
      pauseOnHover: toastOptions.pauseOnHover !== undefined ? toastOptions.pauseOnHover : true,
      dismissible: toastOptions.dismissible !== undefined ? toastOptions.dismissible : true,
      dismissOnClick: toastOptions.dismissOnClick !== undefined ? toastOptions.dismissOnClick : false,
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
    };

    // Add icon string if variant has one and no custom icon provided
    if (!toast.icon && !toast.emoji && toast.variant && toast.variant in iconStrings) {
      toast.iconString = iconStrings[toast.variant as keyof typeof iconStrings];
    }

    return useToastStore.getState().addToast(toast);
  } catch (error) {
    console.error('React Toast Kit: Failed to create toast', error);
    return '';
  }
};

// Enhanced type definitions for function overloads
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

// Enhanced promise handler with better error handling
toast.promise = async <T>(
  promise: Promise<T>,
  options: {
    loading: ToastOptions | string;
    success: ((data: T) => ToastOptions | string) | ToastOptions | string;
    error: ((error: unknown) => ToastOptions | string) | ToastOptions | string;
  }
): Promise<T> => {
  const id = createToast({
    ...((typeof options.loading === 'string') ? { description: options.loading } : options.loading),
    variant: 'loading',
    duration: 0,
  });
  
  try {
    const data = await promise;
    
    let successOptions: ToastOptions | string;
    if (typeof options.success === 'function') {
      successOptions = options.success(data);
    } else {
      successOptions = options.success;
    }
    
    toast.update(
      id,
      typeof successOptions === 'string' 
        ? { description: successOptions, variant: 'success', duration: DEFAULT_DURATION } 
        : { ...successOptions, variant: 'success', duration: successOptions.duration || DEFAULT_DURATION }
    );
    
    return data;
  } catch (error) {
    let errorOptions: ToastOptions | string;
    if (typeof options.error === 'function') {
      errorOptions = options.error(error);
    } else {
      errorOptions = options.error;
    }
    
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
  try {
    const existingToast = useToastStore.getState().toasts.find(t => t.id === id);
    if (existingToast && existingToast.variant === 'loading' && options.variant && options.variant !== 'loading' && !options.duration) {
      options.duration = DEFAULT_DURATION;
    }
    
    useToastStore.getState().updateToast(id, options as Partial<Toast>);
  } catch (error) {
    console.error('React Toast Kit: Failed to update toast', error);
  }
};

toast.dismiss = (id?: string) => {
  try {
    if (id) {
      useToastStore.getState().removeToast(id);
    } else {
      useToastStore.getState().clearAllToasts();
    }
  } catch (error) {
    console.error('React Toast Kit: Failed to dismiss toast', error);
  }
};

toast.clearAll = () => {
  try {
    useToastStore.getState().clearAllToasts();
  } catch (error) {
    console.error('React Toast Kit: Failed to clear all toasts', error);
  }
};

// Development tools (only available in development)
type DevTools = {
  getActiveToasts: () => Toast[];
  clearAll: () => void;
  debugInfo: () => void;
  getStore: () => ToastState;
  simulateError: () => void;
  simulateSuccess: () => void;
};

// Development tools (only available in development)
const devTools = typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ? {
  getActiveToasts: () => useToastStore.getState().toasts,
  clearAll: () => useToastStore.getState().clearAllToasts(),
  debugInfo: () => {
    const state = useToastStore.getState();
    console.group('React Toast Kit Debug Info');
    console.table(state.toasts.map(t => ({
      id: t.id,
      variant: t.variant,
      position: t.position,
      duration: t.duration,
      priority: t.priority,
      createdAt: new Date(t.createdAt).toLocaleTimeString()
    })));
    console.log('Theme:', state.theme, '| Effective:', state.effectiveTheme);
    console.log('Paused toasts:', Array.from(state.pausedToasts));
    console.log('Active timers:', state.activeTimers.size);
    console.log('Registered plugins:', state.plugins.map(p => p.name));
    console.groupEnd();
  },
  getStore: () => useToastStore.getState(),
  simulateError: () => {
    toast.error('This is a test error toast for debugging');
  },
  simulateSuccess: () => {
    toast.success('This is a test success toast for debugging');
  }
} as DevTools : {} as DevTools;

// Plugin registration helpers
export const registerPlugin = (plugin: ToastPlugin) => {
  useToastStore.getState().registerPlugin(plugin);
};

export const unregisterPlugin = (name: string) => {
  useToastStore.getState().unregisterPlugin(name);
};

// Cleanup function for applications
export const cleanup = () => {
  useToastStore.getState().cleanup();
};

// DevTools specific API - only imported when using the devtools entry point
export const toastDevTools = {
  /**
   * Show the DevTools panel
   */
  show: () => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('react-toast-kit:devtools:show');
      window.dispatchEvent(event);
    }
  },

  /**
   * Hide the DevTools panel
   */
  hide: () => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('react-toast-kit:devtools:hide');
      window.dispatchEvent(event);
    }
  },

  /**
   * Toggle the DevTools panel visibility
   */
  toggle: () => {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('react-toast-kit:devtools:toggle');
      window.dispatchEvent(event);
    }
  },

  /**
   * Get all active toasts
   */
  getToasts: () => useToastStore.getState().toasts,

  // Include the development tools but only in development
  ...devTools
  
  // Note: We removed the duplicate clearAll property since it's already in the devTools object
};