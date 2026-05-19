// __CSS_CONTENT__ is replaced at compile time by tsup's `define` option —
// see tsup.config.ts. At runtime this is already a plain string literal.
declare const __CSS_CONTENT__: string;

let cssInjected = false;

export const injectCSS = () => {
  if (typeof document === 'undefined' || cssInjected) return;
  if (document.getElementById('react-toast-kit-styles')) {
    cssInjected = true;
    return;
  }
  try {
    const style = document.createElement('style');
    style.id = 'react-toast-kit-styles';
    style.textContent = __CSS_CONTENT__;
    document.head.insertBefore(style, document.head.firstChild ?? null);
    cssInjected = true;
  } catch (e) {
    console.warn('[react-toast-kit] Could not inject CSS:', e);
  }
};

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }
}

// Core exports — optimized for tree shaking
export { toast } from './toast';
export { ToastProvider } from './ToastProvider';
export { useToast, useToastConfig, useToastStats } from './useToast';
export { useToastStore } from './toast';
export { registerPlugin, unregisterPlugin, cleanup } from './toast';
export { useToastProvider } from './ToastProvider';

export type {
  Toast,
  ToastOptions,
  ToastPosition,
  ToastVariant,
  ToastTheme,
  ToastAnimation,
  ToastStyle,
  ToastAction,
  ProgressBarStyle,
  CustomAnimation,
  ToastPlugin,
  StrictToastOptions,
  ToastStoreConfig,
} from './toast';
