import * as React from 'react';
import { useToastStore, toast,  type ToastOptions } from './toast';
import type { ToastPosition, ToastVariant, ToastAnimation, ToastStyle, ToastTheme } from './toast';

const { useState, useEffect, useCallback, useMemo } = React;

/**
 * A framework-agnostic DevTools component for React Toast Kit
 * This component provides a UI for monitoring and testing toasts
 */
export const ToastDevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'create' | 'settings'>('monitor');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { 
    toasts, 
    theme, 
    effectiveTheme, 
    maxToasts, 
    pausedToasts, 
    activeTimers,
    plugins,
    clearAllToasts,
    removeToast,
    pauseToast,
    resumeToast,
    setTheme,
    setMaxToasts 
  } = useToastStore();

  // Test toast configurations
  const [testConfig, setTestConfig] = useState<ToastOptions>({
    title: 'Test Toast',
    description: 'This is a test toast for debugging',
    variant: 'info',
    position: 'top-right',
    animation: 'slide',
    visualStyle: 'solid',
    duration: 4000,
    pauseOnHover: true,
    dismissible: true,
  });

  // Statistics
  const stats = useMemo(() => {
    const byVariant = toasts.reduce((acc, toast) => {
      acc[toast.variant] = (acc[toast.variant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPosition = toasts.reduce((acc, toast) => {
      acc[toast.position] = (acc[toast.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: toasts.length,
      paused: pausedToasts.size,
      timers: activeTimers.size,
      byVariant,
      byPosition,
    };
  }, [toasts, pausedToasts, activeTimers]);

  // Quick test functions
  const quickTests = {
    success: () => toast.success('✅ Success toast test'),
    error: () => toast.error('❌ Error toast test'),
    warning: () => toast.warning('⚠️ Warning toast test'),
    info: () => toast.info('ℹ️ Info toast test'),
    loading: () => toast.loading('⏳ Loading toast test'),
    custom: () => toast.custom(
      <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <span style={{fontSize: '24px'}}>🎉</span>
        <span>Custom component toast!</span>
      </div>
    ),
    promise: () => {
      const promise = new Promise((resolve, reject) => {
        setTimeout(() => Math.random() > 0.5 ? resolve('Success!') : reject('Failed!'), 2000);
      });
      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Promise resolved!',
        error: 'Promise rejected!'
      });
    },
    stress: () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          toast({
            title: `Stress test toast #${i + 1}`,
            description: 'Testing multiple toasts at once',
            variant: ['success', 'error', 'warning', 'info'][i % 4] as ToastVariant,
            position: ['top-left', 'top-right', 'bottom-left', 'bottom-right'][i % 4] as ToastPosition,
            duration: 2000,
          });
        }, i * 200);
      }
    }
  };

  // Handle test toast creation
  const createTestToast = useCallback(() => {
    toast(testConfig);
  }, [testConfig]);

  useEffect(() => {
    // Set up keyboard shortcut to toggle DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+Shift+D to toggle DevTools
      if (e.altKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prevOpen => !prevOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Don't render in production unless explicitly enabled
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return null;
  }

  // Create a styled wrapper for each platform without relying on specific CSS frameworks
  const getVariantStyle = (variant: ToastVariant = 'default') => {
    switch (variant) {
      case 'success': return { background: '#dcfce7', color: '#166534' };
      case 'error': return { background: '#fee2e2', color: '#b91c1c' };
      case 'warning': return { background: '#fef3c7', color: '#92400e' };
      case 'info': return { background: '#dbeafe', color: '#1e40af' };
      case 'loading': return { background: '#f3f4f6', color: '#4b5563' };
      default: return { background: '#f1f5f9', color: '#334155' };
    }
  };

  // Using inline styles for framework-agnostic compatibility
  const stylesObj = {
    devToolsButton: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 10000,
      width: '48px',
      height: '48px',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      color: 'white',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.5)',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.2s'
    },
    devToolsPanel: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 10000,
      width: isMinimized ? '320px' : '380px',
      height: isMinimized ? '48px' : '600px',
      background: effectiveTheme === 'dark' ? '#1f2937' : 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      border: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column' as const
    },
    panelHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: effectiveTheme === 'dark' ? '#111827' : '#f0f9ff',
      borderBottom: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
    },
    headerTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontWeight: 600,
      fontSize: '14px',
      color: effectiveTheme === 'dark' ? '#f3f4f6' : '#1f2937'
    },
    statusIndicator: {
      width: '8px',
      height: '8px',
      borderRadius: '4px',
      background: '#22c55e'
    },
    tabsContainer: {
      display: 'flex',
      borderBottom: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
    },
    tab: (isActive: boolean) => ({
      flex: 1,
      padding: '10px',
      textAlign: 'center' as const,
      fontSize: '13px',
      color: isActive 
        ? (effectiveTheme === 'dark' ? '#60a5fa' : '#3b82f6') 
        : (effectiveTheme === 'dark' ? '#9ca3af' : '#64748b'),
      background: isActive
        ? (effectiveTheme === 'dark' ? '#111827' : 'white')
        : (effectiveTheme === 'dark' ? '#1f2937' : '#f8fafc'),
      cursor: 'pointer',
      borderBottom: isActive ? `2px solid ${effectiveTheme === 'dark' ? '#60a5fa' : '#3b82f6'}` : '2px solid transparent'
    }),
    contentContainer: {
      padding: '16px',
      overflowY: 'auto' as const,
      flex: 1,
      fontSize: '14px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginBottom: '16px'
    },
    statCard: (isWarning: boolean = false) => ({
      padding: '12px',
      borderRadius: '6px',
      background: effectiveTheme === 'dark'
        ? (isWarning ? '#422006' : '#082f49')
        : (isWarning ? '#fef3c7' : '#f0f9ff'),
      display: 'flex',
      flexDirection: 'column' as const
    }),
    statTitle: (isWarning: boolean = false) => ({
      fontSize: '12px',
      fontWeight: 500,
      color: effectiveTheme === 'dark'
        ? (isWarning ? '#fcd34d' : '#93c5fd')
        : (isWarning ? '#b45309' : '#0369a1'),
      marginBottom: '4px'
    }),
    statValue: (isWarning: boolean = false) => ({
      fontSize: '20px',
      fontWeight: 700,
      color: effectiveTheme === 'dark'
        ? (isWarning ? '#fbbf24' : '#bfdbfe')
        : (isWarning ? '#92400e' : '#0c4a6e')
    }),
    sectionTitle: {
      fontWeight: 600,
      color: effectiveTheme === 'dark' ? '#e2e8f0' : '#334155',
      margin: '16px 0 8px'
    },
    quickTestsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '8px',
      marginBottom: '16px'
    },
    quickTestButton: {
      padding: '8px',
      borderRadius: '6px',
      background: effectiveTheme === 'dark' ? '#1f2937' : '#f1f5f9',
      border: 'none',
      color: effectiveTheme === 'dark' ? '#d1d5db' : '#334155',
      fontSize: '12px',
      cursor: 'pointer',
      textAlign: 'left' as const
    },
    toastsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      maxHeight: '240px',
      overflowY: 'auto' as const
    },
    toastItem: {
      padding: '10px',
      borderRadius: '6px',
      background: effectiveTheme === 'dark' ? '#1f2937' : '#f8fafc',
      border: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e2e8f0'}`
    },
    toastHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px'
    },
    variantBadge: (variant: ToastVariant = 'default') => {
      const style = getVariantStyle(variant);
      return {
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
        background: style.background,
        color: style.color
      };
    },
    toastActions: {
      display: 'flex',
      gap: '4px'
    },
    actionButton: (color: string) => ({
      background: 'none',
      border: 'none',
      fontSize: '11px',
      cursor: 'pointer',
      padding: '2px 4px',
      borderRadius: '4px',
      color: color
    }),
    toastContent: {
      fontSize: '12px',
      color: effectiveTheme === 'dark' ? '#cbd5e1' : '#475569'
    },
    toastTitle: {
      fontWeight: 500,
      color: effectiveTheme === 'dark' ? '#e2e8f0' : '#334155',
      marginBottom: '2px'
    },
    toastDescription: {
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    toastMeta: {
      marginTop: '4px',
      fontSize: '11px',
      color: effectiveTheme === 'dark' ? '#64748b' : '#94a3b8'
    },
    inputGroup: {
      marginBottom: '12px'
    },
    inputLabel: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 500,
      color: effectiveTheme === 'dark' ? '#e2e8f0' : '#334155',
      marginBottom: '4px'
    },
    textInput: {
      width: '100%',
      padding: '8px',
      border: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#cbd5e1'}`,
      borderRadius: '4px',
      fontSize: '12px',
      background: effectiveTheme === 'dark' ? '#1f2937' : 'white',
      color: effectiveTheme === 'dark' ? '#f1f5f9' : 'inherit'
    },
    selectInput: {
      width: '100%',
      padding: '8px',
      border: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#cbd5e1'}`,
      borderRadius: '4px',
      fontSize: '12px',
      background: effectiveTheme === 'dark' ? '#1f2937' : 'white',
      color: effectiveTheme === 'dark' ? '#f1f5f9' : 'inherit'
    },
    createButton: {
      width: '100%',
      padding: '8px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    }
  };

  return (
    <>
      {/* DevTools Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={stylesObj.devToolsButton as React.CSSProperties}
          title="Open Toast DevTools (Alt+Shift+D)"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* DevTools Panel */}
      {isOpen && (
        <div style={stylesObj.devToolsPanel as React.CSSProperties}>
          {/* Header */}
          <div style={stylesObj.panelHeader as React.CSSProperties}>
            <div style={stylesObj.headerTitle as React.CSSProperties}>
              <div style={stylesObj.statusIndicator as React.CSSProperties}></div>
              <span>React Toast Kit DevTools</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: effectiveTheme === 'dark' ? '#0c4a6e' : '#dbeafe',
                color: effectiveTheme === 'dark' ? '#bfdbfe' : '#1e40af'
              }}>
                {stats.total} active
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  padding: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: effectiveTheme === 'dark' ? '#9ca3af' : '#64748b'
                }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M7 14l5-5 5 5" : "M17 10l-5 5-5-5"} />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  padding: '4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444'
                }}
                title="Close DevTools"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Tabs */}
              <div style={stylesObj.tabsContainer as React.CSSProperties}>
                {[
                  { key: 'monitor', label: 'Monitor', icon: '📊' },
                  { key: 'create', label: 'Create', icon: '➕' },
                  { key: 'settings', label: 'Settings', icon: '⚙️' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={stylesObj.tab(activeTab === tab.key) as React.CSSProperties}
                  >
                    <span style={{ marginRight: '4px' }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={stylesObj.contentContainer as React.CSSProperties}>
                {activeTab === 'monitor' && (
                  <div>
                    {/* Stats Overview */}
                    <div style={stylesObj.statsGrid as React.CSSProperties}>
                      <div style={stylesObj.statCard() as React.CSSProperties}>
                        <div style={stylesObj.statTitle() as React.CSSProperties}>Total</div>
                        <div style={stylesObj.statValue() as React.CSSProperties}>{stats.total}</div>
                      </div>
                      <div style={stylesObj.statCard(true) as React.CSSProperties}>
                        <div style={stylesObj.statTitle(true) as React.CSSProperties}>Paused</div>
                        <div style={stylesObj.statValue(true) as React.CSSProperties}>{stats.paused}</div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 style={stylesObj.sectionTitle as React.CSSProperties}>Quick Tests</h3>
                      <div style={stylesObj.quickTestsGrid as React.CSSProperties}>
                        {Object.entries(quickTests).map(([key, fn]) => (
                          <button
                            key={key}
                            onClick={fn}
                            style={stylesObj.quickTestButton as React.CSSProperties}
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Active Toasts */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={stylesObj.sectionTitle as React.CSSProperties}>Active Toasts</h3>
                        {toasts.length > 0 && (
                          <button
                            onClick={clearAllToasts}
                            style={{
                              fontSize: '12px',
                              color: '#ef4444',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      <div style={stylesObj.toastsList as React.CSSProperties}>
                        {toasts.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '16px', color: effectiveTheme === 'dark' ? '#9ca3af' : '#64748b' }}>
                            No active toasts
                          </div>
                        ) : (
                          toasts.map(toast => (
                            <div key={toast.id} style={stylesObj.toastItem as React.CSSProperties}>
                              <div style={stylesObj.toastHeader as React.CSSProperties}>
                                <span style={stylesObj.variantBadge(toast.variant as ToastVariant) as React.CSSProperties}>
                                  {toast.variant || 'default'}
                                </span>
                                <div style={stylesObj.toastActions as React.CSSProperties}>
                                  <button
                                    onClick={() => pausedToasts.has(toast.id) ? resumeToast(toast.id) : pauseToast(toast.id)}
                                    style={stylesObj.actionButton('#2563eb') as React.CSSProperties}
                                  >
                                    {pausedToasts.has(toast.id) ? '▶️' : '⏸️'}
                                  </button>
                                  <button
                                    onClick={() => removeToast(toast.id)}
                                    style={stylesObj.actionButton('#ef4444') as React.CSSProperties}
                                  >
                                    ❌
                                  </button>
                                </div>
                              </div>
                              <div style={stylesObj.toastContent as React.CSSProperties}>
                                <div style={stylesObj.toastTitle as React.CSSProperties}>{toast.title || 'No title'}</div>
                                {toast.description && <div style={stylesObj.toastDescription as React.CSSProperties}>{toast.description}</div>}
                                <div style={stylesObj.toastMeta as React.CSSProperties}>
                                  {toast.position} • {toast.animation || 'slide'} • {toast.duration}ms
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'create' && (
                  <div>
                    <h3 style={stylesObj.sectionTitle as React.CSSProperties}>Create Test Toast</h3>
                    
                    {/* Form inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={stylesObj.inputGroup as React.CSSProperties}>
                        <label style={stylesObj.inputLabel as React.CSSProperties}>Title</label>
                        <input
                          type="text"
                          value={testConfig.title || ''}
                          onChange={(e) => setTestConfig(prev => ({ ...prev, title: e.target.value }))}
                          style={stylesObj.textInput as React.CSSProperties}
                        />
                      </div>
                      
                      <div style={stylesObj.inputGroup as React.CSSProperties}>
                        <label style={stylesObj.inputLabel as React.CSSProperties}>Description</label>
                        <textarea
                          value={testConfig.description || ''}
                          onChange={(e) => setTestConfig(prev => ({ ...prev, description: e.target.value }))}
                          style={{ ...stylesObj.textInput, minHeight: '60px', resize: 'vertical' } as React.CSSProperties}
                          rows={2}
                        />
                      </div>

                      <div style={stylesObj.formGrid as React.CSSProperties}>
                        <div style={stylesObj.inputGroup as React.CSSProperties}>
                          <label style={stylesObj.inputLabel as React.CSSProperties}>Variant</label>
                          <select
                            value={testConfig.variant || 'default'}
                            onChange={(e) => setTestConfig(prev => ({ ...prev, variant: e.target.value as ToastVariant }))}
                            style={stylesObj.selectInput as React.CSSProperties}
                          >
                            <option value="default">Default</option>
                            <option value="success">Success</option>
                            <option value="error">Error</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                            <option value="loading">Loading</option>
                          </select>
                        </div>

                        <div style={stylesObj.inputGroup as React.CSSProperties}>
                          <label style={stylesObj.inputLabel as React.CSSProperties}>Position</label>
                          <select
                            value={testConfig.position || 'top-right'}
                            onChange={(e) => setTestConfig(prev => ({ ...prev, position: e.target.value as ToastPosition }))}
                            style={stylesObj.selectInput as React.CSSProperties}
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                          </select>
                        </div>
                      </div>

                      <div style={stylesObj.formGrid as React.CSSProperties}>
                        <div style={stylesObj.inputGroup as React.CSSProperties}>
                          <label style={stylesObj.inputLabel as React.CSSProperties}>Animation</label>
                          <select
                            value={testConfig.animation || 'slide'}
                            onChange={(e) => setTestConfig(prev => ({ ...prev, animation: e.target.value as ToastAnimation }))}
                            style={stylesObj.selectInput as React.CSSProperties}
                          >
                            <option value="slide">Slide</option>
                            <option value="fade">Fade</option>
                            <option value="scale">Scale</option>
                            <option value="flip">Flip</option>
                            <option value="zoom">Zoom</option>
                            <option value="bounce">Bounce</option>
                          </select>
                        </div>

                        <div style={stylesObj.inputGroup as React.CSSProperties}>
                          <label style={stylesObj.inputLabel as React.CSSProperties}>Style</label>
                          <select
                            value={testConfig.visualStyle || 'solid'}
                            onChange={(e) => setTestConfig(prev => ({ ...prev, visualStyle: e.target.value as ToastStyle }))}
                            style={stylesObj.selectInput as React.CSSProperties}
                          >
                            <option value="solid">Solid</option>
                            <option value="glass">Glass</option>
                            <option value="gradient">Gradient</option>
                            <option value="shimmer">Shimmer</option>
                            <option value="pill">Pill</option>
                            <option value="neon">Neon</option>
                            <option value="retro">Retro</option>
                            <option value="confetti">Confetti</option>
                          </select>
                        </div>
                      </div>

                      <div style={stylesObj.inputGroup as React.CSSProperties}>
                        <label style={stylesObj.inputLabel as React.CSSProperties}>Duration (ms)</label>
                        <input
                          type="number"
                          value={testConfig.duration || 4000}
                          onChange={(e) => setTestConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                          style={stylesObj.textInput as React.CSSProperties}
                        />
                      </div>

                      <button
                        onClick={createTestToast}
                        style={stylesObj.createButton as React.CSSProperties}
                      >
                        Create Toast
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h3 style={stylesObj.sectionTitle as React.CSSProperties}>Global Settings</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={stylesObj.inputGroup as React.CSSProperties}>
                        <label style={stylesObj.inputLabel as React.CSSProperties}>Theme</label>
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value as ToastTheme)}
                          style={stylesObj.selectInput as React.CSSProperties}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                        <div style={{ fontSize: '11px', color: effectiveTheme === 'dark' ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                          Current: {effectiveTheme}
                        </div>
                      </div>

                      <div style={stylesObj.inputGroup as React.CSSProperties}>
                        <label style={stylesObj.inputLabel as React.CSSProperties}>Max Toasts</label>
                        <input
                          type="number"
                          value={maxToasts}
                          onChange={(e) => setMaxToasts(parseInt(e.target.value))}
                          min="1"
                          max="10"
                          style={stylesObj.textInput as React.CSSProperties}
                        />
                      </div>

                      <div style={{ 
                        marginTop: '16px', 
                        paddingTop: '16px', 
                        borderTop: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'}` 
                      }}>
                        <h4 style={{ ...stylesObj.sectionTitle, fontSize: '13px' } as React.CSSProperties}>Keyboard Shortcuts</h4>
                        <div style={{ 
                          fontSize: '12px', 
                          background: effectiveTheme === 'dark' ? '#1f2937' : '#f1f5f9', 
                          padding: '8px',
                          borderRadius: '4px',
                          marginTop: '8px'
                        }}>
                          <div>
                            <strong>Alt + Shift + D</strong>: Toggle DevTools
                          </div>
                        </div>
                      </div>

                      <div style={{ 
                        marginTop: '8px', 
                        paddingTop: '16px', 
                        borderTop: `1px solid ${effectiveTheme === 'dark' ? '#374151' : '#e5e7eb'}` 
                      }}>
                        <h4 style={{ ...stylesObj.sectionTitle, fontSize: '13px' } as React.CSSProperties}>Plugin Info</h4>
                        {plugins.length === 0 ? (
                          <div style={{ 
                            fontSize: '12px', 
                            color: effectiveTheme === 'dark' ? '#9ca3af' : '#64748b'
                          }}>
                            No plugins registered
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {plugins.map(plugin => (
                              <div key={plugin.name} style={{ 
                                fontSize: '12px', 
                                background: effectiveTheme === 'dark' ? '#1f2937' : '#f1f5f9', 
                                padding: '8px',
                                borderRadius: '4px'
                              }}>
                                <div style={{ fontWeight: 500 }}>{plugin.name}</div>
                                <div style={{ color: effectiveTheme === 'dark' ? '#9ca3af' : '#64748b' }}>{plugin.description}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ToastDevTools;