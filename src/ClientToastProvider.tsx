'use client';

import { ToastProvider } from './ToastProvider';
import { ToastPosition, ToastTheme } from './toast';
import React from 'react';

interface ClientToastProviderProps {
  children?: React.ReactNode;
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
  maxToasts?: number;
  /** Offset from the top edge (for sticky headers) in pixels */
  topOffset?: number;
  /** Offset from the bottom edge (for sticky footers) in pixels */
  bottomOffset?: number;
  /** Offset from the left edge in pixels */
  leftOffset?: number;
  /** Offset from the right edge in pixels */
  rightOffset?: number;
  /** Default animation style */
  defaultAnimation?: 'slide' | 'fade' | 'bounce' | 'none';
  /** Enable accessible announcements for screen readers */
  enableAccessibleAnnouncements?: boolean;
  /** Custom class name for the toast container */
  containerClassName?: string;
  /** Additional global style options */
  toastClassName?: string;
}

// Next.js specific client component wrapper with 'use client' directive
export function ClientToastProvider(props: ClientToastProviderProps) {
  return <ToastProvider {...props} />;
}