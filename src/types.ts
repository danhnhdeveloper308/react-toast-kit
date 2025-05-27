// Re-export all types from toast.ts for better organization
export type {
  Toast,
  ToastOptions,
  ToastPosition,
  ToastVariant,
  ToastTheme,
  ToastAnimation,
  ToastStyle,
  ProgressBarStyle,  // Add the missing ProgressBarStyle export
  CustomAnimation,
  ToastPlugin,
  StrictToastOptions
} from './toast';

// Additional utility types for better TypeScript experience
import type { JSX } from 'react';
import type { ToastOptions, Toast, ToastPosition, ToastTheme, ToastAnimation, ToastStyle, ToastPlugin } from './toast';

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

// Provider props interface
export interface ToastProviderProps {
  children?: React.ReactNode;
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

// Toast portal props interface
export interface ToastPortalProps {
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
}

// Event types for callbacks
export type ToastEventType = 'create' | 'update' | 'dismiss' | 'pause' | 'resume';

export interface ToastEvent {
  type: ToastEventType;
  toast: Toast;
  timestamp: number;
}

// Configuration types
export interface ToastConfig {
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  maxToasts?: number;
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