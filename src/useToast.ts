import { toast } from './toast';
import { useToastStore } from './toast';
import type { ToastTheme } from './toast';

/**
 * React hook for accessing toast functionality and state.
 * This provides a React-friendly way to use toast notifications in functional components.
 * 
 * @returns An object containing toast functions and state.
 */
export const useToast = () => {
  // Get current state and actions from the toast store
  const {
    theme, 
    setTheme,
    clearAllToasts: clearAll,
    toasts
  } = useToastStore();
  
  /**
   * Change the theme for toast notifications
   * @param newTheme The theme to set ('light', 'dark', or 'system')
   */
  const changeTheme = (newTheme: ToastTheme) => {
    setTheme(newTheme);
  };
  
  /**
   * Dismiss all active toasts or a specific toast by ID
   * @param id Optional ID of the toast to dismiss
   */
  const dismiss = (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      clearAll();
    }
  };

  // Return all the toast functionality and state in a single object
  return {
    // Expose the toast function and all its methods
    toast,
    
    // Theme-related functionality
    theme,
    setTheme: changeTheme,
    
    // Toast management
    dismiss,
    clearAll,
    
    // Current state
    toasts,
    count: toasts.length,
  };
};