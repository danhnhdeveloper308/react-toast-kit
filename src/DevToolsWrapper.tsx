import * as React from 'react';
import { ToastDevTools } from './DevTools';

const { createContext, useContext, useEffect, useState } = React;

// Create a context for DevTools visibility
interface DevToolsContextType {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  toggle: () => void;
}

const DevToolsContext = createContext<DevToolsContextType>({
  visible: false,
  setVisible: () => {},
  toggle: () => {},
});

// Configuration for DevTools
export interface DevToolsConfig {
  /**
   * Whether DevTools should be enabled
   * @default false in production, true in development
   */
  enabled?: boolean;
  
  /**
   * Whether DevTools should be visible by default
   * @default false
   */
  defaultVisible?: boolean;
  
  /**
   * Keyboard shortcut to toggle DevTools
   * @default 'alt+shift+d'
   */
  shortcut?: string;
  
  /**
   * Whether to show DevTools button
   * @default true
   */
  showButton?: boolean;
  
  /**
   * Position of the DevTools button
   * @default 'bottom-right'
   */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

// Global DevTools configuration
let devToolsConfig: DevToolsConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  defaultVisible: false,
  shortcut: 'alt+shift+d',
  showButton: true,
  buttonPosition: 'bottom-right',
};

/**
 * Configure the DevTools globally
 * @param config DevTools configuration
 */
export function configureDevTools(config: DevToolsConfig) {
  devToolsConfig = { ...devToolsConfig, ...config };
}

/**
 * Hook to access DevTools visibility state
 */
export function useDevToolsVisible() {
  const context = useContext(DevToolsContext);
  return {
    visible: context.visible,
    setVisible: context.setVisible,
    toggle: context.toggle,
  };
}

// The DevTools component that will be lazily loaded
export const ClientDevTools = ({ visible = false }: { visible?: boolean }) => {
  if (!visible) return null;
  return <ToastDevTools />;
};

/**
 * DevToolsWrapper - A wrapper for DevTools with visibility control and keyboard shortcut
 */
export default function DevToolsWrapper({ 
  children,
  config 
}: { 
  children?: React.ReactNode;
  config?: DevToolsConfig;
}) {
  // Merge provided config with global config
  const mergedConfig = { ...devToolsConfig, ...config };
  const { enabled, defaultVisible, shortcut } = mergedConfig;
  
  // DevTools visibility state
  const [visible, setVisible] = useState<boolean>(defaultVisible || false);
  
  // Keyboard shortcut handler
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Default: Alt+Shift+D
      if (shortcut === 'alt+shift+d' && e.altKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setVisible(prevVisible => !prevVisible);
      } else if (shortcut) {
        // Custom shortcut parsing
        const keys = shortcut.toLowerCase().split('+');
        const modifiers = {
          alt: keys.includes('alt'),
          shift: keys.includes('shift'),
          ctrl: keys.includes('ctrl') || keys.includes('control'),
          meta: keys.includes('meta') || keys.includes('command') || keys.includes('cmd'),
        };
        
        const key = keys.filter(k => !['alt', 'shift', 'ctrl', 'control', 'meta', 'command', 'cmd'].includes(k))[0];
        
        if (
          (!modifiers.alt || e.altKey) &&
          (!modifiers.shift || e.shiftKey) &&
          (!modifiers.ctrl || e.ctrlKey) &&
          (!modifiers.meta || e.metaKey) &&
          key === e.key.toLowerCase()
        ) {
          setVisible(prevVisible => !prevVisible);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, shortcut]);
  
  // Don't render anything in production unless explicitly enabled
  if (!enabled) {
    return <>{children}</>;
  }
  
  // Toggle visibility
  const toggle = () => setVisible(prevVisible => !prevVisible);
  
  return (
    <DevToolsContext.Provider value={{ visible, setVisible, toggle }}>
      {children}
      <ClientDevTools visible={visible} />
    </DevToolsContext.Provider>
  );
}