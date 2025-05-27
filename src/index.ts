// CSS Auto-injection for React Toast Kit
// Không khai báo fs và path để tránh lỗi TypeScript về biến không sử dụng
// Sẽ sử dụng CSS đã nhúng cứng thay vì đọc file

let cssInjected = false;

const injectCSS = () => {
  if (typeof document === 'undefined' || cssInjected) return;
  
  // Check if CSS is already injected
  if (document.getElementById('react-toast-kit-styles')) {
    cssInjected = true;
    return;
  }
  
  try {
    const style = document.createElement('style');
    style.id = 'react-toast-kit-styles';
    style.setAttribute('data-toast-kit-version', '1.0.3');
    
    // Inject CSS directly instead of reading from file
    // This content will be replaced by build script
    const cssContent = '/* CSS will be injected during build */';
    
    // Also include progress bar styles
    const progressStylesContent = '/* Progress bar styles will be injected during build */';

    style.textContent = cssContent + progressStylesContent;
    
    // Insert at the beginning of head for proper CSS precedence
    if (document.head) {
      if (document.head.firstChild) {
        document.head.insertBefore(style, document.head.firstChild);
      } else {
        document.head.appendChild(style);
      }
    }
    
    cssInjected = true;
    
    // Removed console.log for production
  } catch (error) {
    console.warn('[react-toast-kit] Could not auto-inject CSS:', error);
  }
};

// Auto-inject CSS when this module is imported
if (typeof window !== 'undefined') {
  // Immediate injection if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }
}

// Enhanced version check for development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Development mode warnings
  if (typeof window !== 'undefined') {
    // Check for common conflicts
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      setTimeout(() => {
        const existingToastLibs = [
          'react-hot-toast',
          'react-toastify',
          'react-toast-notifications'
        ].filter(lib => {
          try {
            return require.resolve(lib);
          } catch {
            return false;
          }
        });
        
        if (existingToastLibs.length > 0) {
          console.warn(
            `React Toast Kit: Detected other toast libraries: ${existingToastLibs.join(', ')}. ` +
            'This may cause conflicts. Consider removing them.'
          );
        }
      }, 1000);
    }
  }
}

// Core exports - optimized for tree shaking
// Note: toast function doesn't use React hooks, so it's safe to export directly
export { toast } from './toast';

// Provider exports - these are client components
export { ToastProvider } from './ToastProvider';

// Hook exports - these need to be used in client components
export { useToast } from './useToast';
export { useToastStore } from './toast';

// Enhanced exports - new functionality
export { 
  registerPlugin, 
  unregisterPlugin, 
  cleanup,
  toastDevTools 
} from './toast';

// Type exports with better organization
export type {
  // Core types
  Toast,
  ToastOptions,
  ToastPosition,
  ToastVariant,
  ToastTheme,
  ToastAnimation,
  ToastStyle,
  ProgressBarStyle,  // Add the missing ProgressBarStyle export
  
  // Enhanced types
  CustomAnimation,
  ToastPlugin,
  StrictToastOptions
} from './toast';

// Provider context export
export { useToastProvider } from './ToastProvider';

// Export CSS injection function for manual control
export { injectCSS };