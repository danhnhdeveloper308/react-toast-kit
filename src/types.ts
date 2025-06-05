// Re-export all types from toast.ts for better organization
export type {
  Toast,
  ToastOptions,
  ToastPosition,
  ToastVariant,
  ToastTheme,
  ToastAnimation,
  ToastStyle,
  ProgressBarStyle,
  CustomAnimation,
  ToastPlugin,
  StrictToastOptions
} from './toast';

// Additional utility types for better TypeScript experience
import type { JSX } from 'react';
import type { ToastOptions, Toast, ToastPosition, ToastTheme, ToastAnimation, ToastStyle, ToastPlugin, ProgressBarStyle } from './toast';

export type ToastId = string;

export type ToastHandler = {
  (message: string): ToastId;
  (options: ToastOptions): ToastId;
  success: (options: ToastOptions | string) => ToastId;
  error: (options: ToastOptions | string) => ToastId;
  warning: (options: ToastOptions | string) => ToastId;
  info: (options: ToastOptions | string) => ToastId;
  loading: (options: ToastOptions | string) => ToastId;
  custom: (component: JSX.Element, options?: Omit<ToastOptions, 'component'>) => ToastId;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: ToastOptions | string;
      success: ((data: T) => ToastOptions | string) | ToastOptions | string;
      error: ((error: unknown) => ToastOptions | string) | ToastOptions | string;
    }
  ) => Promise<T>;
  update: (id: ToastId, options: Partial<ToastOptions>) => void;
  dismiss: (id?: ToastId) => void;
  clearAll: () => void;
};

// Enhanced Provider props interface with all the new configuration options
export interface ToastProviderProps {
  children?: React.ReactNode;
  
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
  suppressHydrationWarning?: boolean;
  
  // Global overrides (apply to all toasts unless explicitly overridden)
  globalClassName?: string;
  globalStyle?: React.CSSProperties;
}

// Hook return types
export interface UseToastReturn {
  toasts: Toast[];
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  maxToasts: number;
  plugins: ToastPlugin[];
  addToast: (toast: Toast) => ToastId;
  removeToast: (id: ToastId) => void;
  updateToast: (id: ToastId, toast: Partial<Toast>) => void;
  clearAllToasts: () => void;
  pauseToast: (id: ToastId) => void;
  resumeToast: (id: ToastId) => void;
  setTheme: (theme: ToastTheme) => void;
  setMaxToasts: (max: number) => void;
  registerPlugin: (plugin: ToastPlugin) => void;
  unregisterPlugin: (name: string) => void;
  getToastById: (id: ToastId) => Toast | undefined;
  hasToasts: () => boolean;
  stats: {
    total: number;
    byVariant: Record<string, number>;
    byPosition: Record<ToastPosition, number>;
  };
}

// Enhanced Toast portal props interface
export interface ToastPortalProps {
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  enableAccessibleAnnouncements?: boolean;
  suppressHydrationWarning?: boolean;
}

// Event types for callbacks
export type ToastEventType = 'create' | 'update' | 'dismiss' | 'pause' | 'resume';

export interface ToastEvent {
  type: ToastEventType;
  toast: Toast;
  timestamp: number;
}

// Enhanced configuration types with all the new options
export interface ToastConfig {
  // Basic options
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  maxToasts?: number;
  
  // Behavior options
  defaultDismissible?: boolean;
  defaultPauseOnHover?: boolean;
  defaultDismissOnClick?: boolean;
  
  // Progress bar options
  defaultProgressBarStyle?: ProgressBarStyle;
  defaultProgressBarColor?: string;
  defaultProgressBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  defaultProgressBarThickness?: number;
  defaultProgressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  
  // Advanced options
  defaultFloating?: boolean;
  defaultRippleEffect?: boolean;
  defaultSwipeToDismiss?: boolean;
  defaultPriority?: 'low' | 'normal' | 'high';
  defaultStagger?: number;
  
  // Global styling
  globalClassName?: string;
  globalStyle?: React.CSSProperties;
}

// Plugin development types
export interface PluginContext {
  toasts: Toast[];
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark' | 'system';
  maxToasts: number;
}

export type PluginHook = 
  | 'beforeCreate'
  | 'afterCreate' 
  | 'beforeRemove'
  | 'afterRemove'
  | 'beforeUpdate'
  | 'afterUpdate';

// Accessibility types
export interface ToastA11yProps {
  role?: 'alert' | 'status' | 'log';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Provider context types
export interface ToastProviderContext {
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