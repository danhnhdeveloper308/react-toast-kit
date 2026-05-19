// Public type re-exports — single source of truth is toast.ts.
// Consumers can import everything they need from 'react-toast-kit' directly.
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
  StrictToastOptions,
  ToastStoreConfig,
} from './toast';

import type { JSX } from 'react';
import type {
  ToastOptions,
  ToastPosition,
  ToastTheme,
  ToastAnimation,
  ToastStyle,
  ToastPlugin,
  ProgressBarStyle,
  Toast,
} from './toast';

// Convenience alias
export type ToastId = string;

// Public shape of the imperative toast() function
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

// Props exposed by <ToastProvider>
export interface ToastProviderProps {
  children?: React.ReactNode;
  theme?: ToastTheme;
  position?: ToastPosition;
  maxToasts?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  defaultDuration?: number;
  defaultDismissible?: boolean;
  defaultPauseOnHover?: boolean;
  defaultDismissOnClick?: boolean;
  defaultProgressBarStyle?: ProgressBarStyle;
  defaultProgressBarColor?: string;
  defaultProgressBarPosition?: 'top' | 'bottom' | 'left' | 'right';
  defaultProgressBarThickness?: number;
  defaultProgressAnimation?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  defaultFloating?: boolean;
  defaultRippleEffect?: boolean;
  defaultSwipeToDismiss?: boolean;
  defaultPriority?: 'low' | 'normal' | 'high';
  defaultStagger?: number;
  containerClassName?: string;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  enableAccessibleAnnouncements?: boolean;
  enableDevMode?: boolean;
  enableDevTools?: boolean;
  suppressHydrationWarning?: boolean;
  globalClassName?: string;
  globalStyle?: React.CSSProperties;
}

// Return shape of useToast()
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

// Portal container props
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

// Lifecycle event types (for plugin authors)
export type ToastEventType = 'create' | 'update' | 'dismiss' | 'pause' | 'resume';

export interface ToastEvent {
  type: ToastEventType;
  toast: Toast;
  timestamp: number;
}

// Plugin hooks that actually exist on ToastPlugin
export type PluginHook = 'beforeCreate' | 'afterCreate' | 'beforeRemove' | 'afterRemove';

// Context available inside plugin callbacks
export interface PluginContext {
  toasts: Toast[];
  theme: ToastTheme;
  effectiveTheme: 'light' | 'dark';
  maxToasts: number;
}

// Accessibility attribute helpers
export interface ToastA11yProps {
  role?: 'alert' | 'status' | 'log';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-label'?: string;
  'aria-describedby'?: string;
}
