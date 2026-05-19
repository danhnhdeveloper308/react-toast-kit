import * as React from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from './toast';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import type { Toast, ToastPosition, ToastAnimation, ToastStyle, ToastAction } from './toast';
import type { TargetAndTransition } from 'framer-motion';

const { useEffect, useState, memo, useRef, useCallback, useMemo } = React;

// Scans DOM for the highest in-use z-index so the portal sits on top.
// Result is cached for 5 seconds to avoid repeated DOM walks.
const findHighestZIndex = (() => {
  let cached: number | null = null;
  let lastCheck = 0;
  return (): number => {
    const now = Date.now();
    if (cached !== null && now - lastCheck < 5000) return cached;
    let highest = 9000;
    if (typeof window !== 'undefined') {
      try {
        const elements = document.getElementsByTagName('*');
        for (let i = 0; i < elements.length; i++) {
          const z = parseInt(window.getComputedStyle(elements[i]).zIndex, 10);
          if (z && z > highest) highest = z;
        }
      } catch {
        // Ignore cross-origin or permission errors
      }
    }
    cached = highest + 1;
    lastCheck = now;
    return cached;
  };
})();

interface ToastPortalProps {
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

const DEVICE_BREAKPOINTS = { mobile: 640, tablet: 1024 };
const TOAST_WIDTHS = { mobile: 320, tablet: 360, desktop: 380 };

// ─── SVGIcon ────────────────────────────────────────────────────────────────

const SVGIcon = memo(({ svgString, className = '' }: { svgString: string; className?: string }) => {
  const html = useMemo(() => ({ __html: svgString }), [svgString]);
  return <div className={className} dangerouslySetInnerHTML={html} />;
});
SVGIcon.displayName = 'SVGIcon';

// ─── AccessibilityAnnouncer ──────────────────────────────────────────────────

const AccessibilityAnnouncer = memo(({ toasts }: { toasts: Toast[] }) => {
  const [announcement, setAnnouncement] = useState('');
  const lastTextRef = useRef('');
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[0];
    if (latest.id === lastIdRef.current) return;

    let text = latest.variant ? `${latest.variant} notification: ` : '';
    if (latest.title) text += latest.title + (latest.description ? '. ' : '');
    if (latest.description) text += latest.description;

    if (text && text !== lastTextRef.current) {
      lastTextRef.current = text;
      lastIdRef.current = latest.id;
      setAnnouncement(text);
      setTimeout(() => setAnnouncement(''), 1000);
    }
  }, [toasts]);

  if (!announcement) return null;
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
      {announcement}
    </div>
  );
});
AccessibilityAnnouncer.displayName = 'AccessibilityAnnouncer';

// ─── useSwipeGesture ─────────────────────────────────────────────────────────

const useSwipeGesture = (enabled: boolean, onSwipe: () => void, threshold = 100) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      swiping.current = false;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      const dx = Math.abs(e.touches[0].clientX - startX.current);
      const dy = Math.abs(e.touches[0].clientY - startY.current);
      if (dx > dy && dx > 10) {
        swiping.current = true;
        e.preventDefault();
      }
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !swiping.current) return;
      if (Math.abs(e.changedTouches[0].clientX - startX.current) > threshold) onSwipe();
      swiping.current = false;
    },
    [enabled, onSwipe, threshold]
  );

  return { handleTouchStart, handleTouchMove, handleTouchEnd };
};

// ─── ProgressBar ─────────────────────────────────────────────────────────────

// Separate component that owns the animation so it can pause/resume cleanly.
const ProgressBar = memo(({
  duration,
  isPaused,
  progressBarStyle,
  progressBarColor,
  progressBarThickness,
  progressBarPosition,
  progressAnimation,
}: {
  duration: number;
  isPaused: boolean;
  progressBarStyle?: string;
  progressBarColor?: string;
  progressBarThickness?: number;
  progressBarPosition?: string;
  progressAnimation?: string;
}) => {
  const controls = useAnimation();
  const totalPausedMsRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const animStartRef = useRef(Date.now());
  const ease = (progressAnimation || 'linear') as string;

  const isVertical = progressBarPosition === 'left' || progressBarPosition === 'right';

  // Start animation once on mount — scaleX/scaleY is GPU-accelerated (no layout reflow)
  useEffect(() => {
    animStartRef.current = Date.now();
    if (isVertical) {
      controls.start({ scaleY: 0, transition: { duration: duration / 1000, ease } });
    } else {
      controls.start({ scaleX: 0, transition: { duration: duration / 1000, ease } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause / resume the animation whenever the toast is hovered
  useEffect(() => {
    if (isPaused) {
      controls.stop();
      pauseStartRef.current = Date.now();
    } else if (pauseStartRef.current !== null) {
      totalPausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
      const activeMs = Date.now() - animStartRef.current - totalPausedMsRef.current;
      const remaining = Math.max(0, duration / 1000 - activeMs / 1000);
      if (isVertical) {
        controls.start({ scaleY: 0, transition: { duration: remaining, ease: 'linear' } });
      } else {
        controls.start({ scaleX: 0, transition: { duration: remaining, ease: 'linear' } });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const baseClass = `react-toast-progress${progressBarStyle ? ` ${progressBarStyle}` : ''}`;

  return (
    <div className={baseClass}>
      <motion.div
        animate={controls}
        initial={isVertical ? { scaleY: 1 } : { scaleX: 1 }}
        className="react-toast-progress-fill"
        style={{
          backgroundColor: progressBarColor || undefined,
          transformOrigin: isVertical ? 'top center' : 'left center',
          ...(isVertical
            ? { width: progressBarThickness ? `${progressBarThickness}px` : undefined }
            : { height: progressBarThickness ? `${progressBarThickness}px` : undefined }),
        }}
      />
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// ─── ToastItem ───────────────────────────────────────────────────────────────

const ToastItem = memo(({
  toast,
  onDismiss,
  onPause,
  onResume,
  animation,
  position,
  toastTheme,
  defaultStyle,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  animation: ToastAnimation;
  position: ToastPosition;
  toastTheme: 'light' | 'dark';
  defaultStyle: ToastStyle;
}) => {
  const toastRef = useRef<HTMLDivElement>(null);

  // Subscribe only to this toast's pause state to avoid re-rendering all items
  const isPaused = useToastStore((state) => state.pausedToasts.has(toast.id));

  const handleDismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  const handlePause = useCallback(() => {
    if (toast.pauseOnHover) onPause(toast.id);
  }, [onPause, toast.id, toast.pauseOnHover]);

  const handleResume = useCallback(() => onResume(toast.id), [onResume, toast.id]);

  const handleRippleEffect = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (toast.rippleEffect && toastRef.current) {
        const rect = toastRef.current.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'toast-ripple-element';
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        toastRef.current.appendChild(ripple);
        setTimeout(() => {
          if (toastRef.current?.contains(ripple)) toastRef.current.removeChild(ripple);
        }, 700);
      }
      if (toast.dismissOnClick) handleDismiss();
    },
    [toast.rippleEffect, toast.dismissOnClick, handleDismiss]
  );

  // CSS custom properties for gradient variant
  const variantStyles = useMemo<React.CSSProperties>(() => {
    const styleClass = toast.visualStyle || defaultStyle;
    if (styleClass !== 'gradient') return {};
    const isDark = toastTheme === 'dark';
    const map: Record<string, [string, string]> = {
      success: [isDark ? 'rgba(5,95,70,.9)' : 'rgba(16,185,129,.8)', isDark ? 'rgba(4,120,87,.8)' : 'rgba(5,150,105,.7)'],
      error: [isDark ? 'rgba(153,27,27,.9)' : 'rgba(239,68,68,.8)', isDark ? 'rgba(185,28,28,.8)' : 'rgba(220,38,38,.7)'],
      warning: [isDark ? 'rgba(146,64,14,.9)' : 'rgba(245,158,11,.8)', isDark ? 'rgba(180,83,9,.8)' : 'rgba(217,119,6,.7)'],
      info: [isDark ? 'rgba(30,64,175,.9)' : 'rgba(59,130,246,.8)', isDark ? 'rgba(29,78,216,.8)' : 'rgba(37,99,235,.7)'],
    };
    const [from, to] = map[toast.variant] ?? [
      isDark ? 'rgba(55,65,81,.9)' : 'rgba(229,231,235,.8)',
      isDark ? 'rgba(75,85,99,.8)' : 'rgba(209,213,219,.7)',
    ];
    return { '--toast-gradient-from': from, '--toast-gradient-to': to } as React.CSSProperties;
  }, [toast.variant, toast.visualStyle, toastTheme, defaultStyle]);

  const animationVariants = useMemo(() => {
    if (toast.customAnimation) {
      return {
        initial: toast.customAnimation.initial as TargetAndTransition,
        animate: toast.customAnimation.animate as TargetAndTransition,
        exit: toast.customAnimation.exit as TargetAndTransition,
      };
    }

    const anim = toast.animation || animation;
    const pos = toast.position || position;
    const isTop = pos.startsWith('top');
    const isLeft = pos.endsWith('left');
    const isRight = pos.endsWith('right');

    if (anim === 'none') return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } };
    if (anim === 'fade') return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

    if (anim === 'bounce') {
      const initial: TargetAndTransition = { opacity: 0, scale: 0.9 };
      if (isTop) Object.assign(initial, { y: -80 });
      else if (isLeft) Object.assign(initial, { x: -80 });
      else if (isRight) Object.assign(initial, { x: 80 });
      else Object.assign(initial, { y: 80 });
      return {
        initial,
        animate: { opacity: 1, y: 0, x: 0, scale: 1, transition: { type: 'spring', stiffness: 350, damping: 25 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
      };
    }

    if (anim === 'flip') {
      return {
        initial: { opacity: 0, rotateX: 90, perspective: 400 },
        animate: { opacity: 1, rotateX: 0, perspective: 400, transition: { type: 'spring', stiffness: 300, damping: 25 } },
        exit: { opacity: 0, rotateX: 90, perspective: 400, transition: { duration: 0.3 } },
      };
    }

    if (anim === 'zoom') {
      return {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
        exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
      };
    }

    if (anim === 'elastic') {
      const initial: TargetAndTransition = { opacity: 0, scale: 0.8 };
      if (isTop) Object.assign(initial, { y: -30 });
      else if (isLeft) Object.assign(initial, { x: -30 });
      else if (isRight) Object.assign(initial, { x: 30 });
      else Object.assign(initial, { y: 30 });
      return {
        initial,
        animate: {
          opacity: 1, y: 0, x: 0, scale: 1,
          transition: { type: 'spring', stiffness: 500, damping: 20, mass: 0.8 },
        },
        exit: {
          opacity: 0, scale: 0.85,
          transition: { type: 'spring', stiffness: 600, damping: 35 },
        },
      };
    }

    // slide (default)
    const initial: TargetAndTransition = { opacity: 0 };
    const exit: TargetAndTransition = { opacity: 0 };
    if (isTop) { Object.assign(initial, { y: -20 }); Object.assign(exit, { y: -20 }); }
    else if (isLeft) { Object.assign(initial, { x: -20 }); Object.assign(exit, { x: -20 }); }
    else if (isRight) { Object.assign(initial, { x: 20 }); Object.assign(exit, { x: 20 }); }
    else { Object.assign(initial, { y: 20 }); Object.assign(exit, { y: 20 }); }

    return { initial, animate: { opacity: 1, y: 0, x: 0 }, exit };
  }, [toast.customAnimation, toast.animation, animation, toast.position, position]);

  const additionalClasses = useMemo(() => {
    const classes: string[] = [];
    if (toast.floating) classes.push('react-toast-floating');
    if (toast.rippleEffect) classes.push('toast-ripple');
    const vs = toast.visualStyle || defaultStyle;
    if (vs === 'glass' || vs === 'gradient') classes.push('toast-soft-shadow');
    return classes.join(' ');
  }, [toast.floating, toast.rippleEffect, toast.visualStyle, defaultStyle]);

  const iconColor = useMemo(() => {
    if (toast.variant === 'custom') return '';
    if (!toast.variant || toast.variant === 'default') return toastTheme === 'dark' ? 'text-gray-300' : 'text-gray-500';
    return 'text-white';
  }, [toast.variant, toastTheme]);

  const progressBarClasses = useMemo(() => {
    if (toast.progressBarStyle) return toast.progressBarStyle;
    if (toast.variant === 'custom') return 'bg-white/20';
    if (!toast.variant || toast.variant === 'default')
      return toastTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-300';
    return 'bg-white/30';
  }, [toast.progressBarStyle, toast.variant, toastTheme]);

  const swipeGesture = useSwipeGesture(toast.swipeToDismiss || false, handleDismiss);

  return (
    <motion.div
      key={toast.id}
      className="react-toast-item w-full"
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={{ duration: toast.updating ? 0.1 : 0.2 }}
      layout
    >
      <div
        ref={toastRef}
        role={toast.variant === 'error' ? 'alert' : 'status'}
        aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
        className={`relative overflow-hidden shadow-lg rounded-lg react-toast w-full ${toast.className || ''} ${additionalClasses}`}
        style={{ ...(toast.style || {}), ...variantStyles }}
        onMouseEnter={handlePause}
        onMouseLeave={handleResume}
        onClick={handleRippleEffect}
        onTouchStart={swipeGesture.handleTouchStart}
        onTouchMove={swipeGesture.handleTouchMove}
        onTouchEnd={swipeGesture.handleTouchEnd}
        data-variant={toast.variant}
        data-theme={toastTheme}
        data-style={toast.visualStyle || defaultStyle}
        data-progress-position={toast.progressBarPosition || 'bottom'}
        data-testid={`toast-${toast.id}`}
        tabIndex={0}
      >
        {/* Progress bar — purely visual; the store timer owns dismissal timing */}
        {toast.duration > 0 && (
          <ProgressBar
            duration={toast.duration}
            isPaused={isPaused}
            progressBarStyle={progressBarClasses}
            progressBarColor={toast.progressBarColor}
            progressBarThickness={toast.progressBarThickness}
            progressBarPosition={toast.progressBarPosition}
            progressAnimation={toast.progressAnimation}
          />
        )}

        <div className="p-4 toast-content">
          {toast.variant === 'custom' && toast.component ? (
            toast.component
          ) : (
            <div className="flex items-start">
              {toast.emoji ? (
                <div className="flex-shrink-0 mr-3 toast-emoji">{toast.emoji}</div>
              ) : toast.icon ? (
                <div className={`flex-shrink-0 mr-3 ${iconColor} toast-icon-container toast-icon-animated`}>
                  {toast.icon}
                </div>
              ) : toast.iconString ? (
                <div className={`flex-shrink-0 mr-3 ${iconColor} toast-icon-container toast-icon-animated`}>
                  <SVGIcon svgString={toast.iconString} className={iconColor} />
                </div>
              ) : null}

              <div className="flex-1">
                {toast.title && <h4 className="font-medium mb-1">{toast.title}</h4>}
                {toast.description && <div className="toast-description">{toast.description}</div>}
                {toast.actions && toast.actions.length > 0 && (
                  <div className="toast-actions">
                    {toast.actions.map((action: ToastAction, i: number) => (
                      <button
                        key={i}
                        data-variant={action.variant || 'primary'}
                        className="toast-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(toast.id);
                          if (action.closeOnClick !== false) onDismiss(toast.id);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {toast.dismissible && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                  className="react-toast-close"
                  aria-label="Close notification"
                  data-dismiss="toast"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
ToastItem.displayName = 'ToastItem';

// ─── ToastContainer ───────────────────────────────────────────────────────────

const ToastContainer = memo(({
  position,
  toasts,
  positionStyle,
  onDismiss,
  onPause,
  onResume,
  defaultAnimation,
  toastTheme,
  defaultStyle,
  containerClassName,
}: {
  position: ToastPosition;
  toasts: Toast[];
  positionStyle: React.CSSProperties;
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  defaultAnimation: ToastAnimation;
  toastTheme: 'light' | 'dark';
  defaultStyle: ToastStyle;
  containerClassName?: string;
}) => (
  <div
    className={`fixed flex flex-col z-50 react-toast-container ${containerClassName || ''}`}
    data-position={position}
    data-theme={toastTheme}
    style={positionStyle}
  >
    <AnimatePresence mode="sync">
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
          animation={t.animation || defaultAnimation}
          position={position}
          toastTheme={toastTheme}
          defaultStyle={defaultStyle}
        />
      ))}
    </AnimatePresence>
  </div>
));
ToastContainer.displayName = 'ToastContainer';

// ─── ToastPortal ──────────────────────────────────────────────────────────────

const ToastPortal: React.FC<ToastPortalProps> = ({
  containerClassName = '',
  topOffset = 16,
  bottomOffset = 16,
  leftOffset = 16,
  rightOffset = 16,
  defaultAnimation = 'slide',
  defaultStyle = 'solid',
  enableAccessibleAnnouncements = true,
  suppressHydrationWarning = false,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const screenWidthRef = useRef(1024);

  // Use Zustand selectors to subscribe only to the data this component needs
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);
  const pauseToast = useToastStore((state) => state.pauseToast);
  const resumeToast = useToastStore((state) => state.resumeToast);
  const effectiveTheme = useToastStore((state) => state.effectiveTheme);

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    screenWidthRef.current = width;
    const next =
      width < DEVICE_BREAKPOINTS.mobile ? 'mobile' : width < DEVICE_BREAKPOINTS.tablet ? 'tablet' : 'desktop';
    setDeviceType((prev) => (prev !== next ? next : prev));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    handleResize();
    setIsMounted(true);

    let portalDiv = document.getElementById('react-toast-kit-portal') as HTMLDivElement;
    if (!portalDiv) {
      portalDiv = document.createElement('div');
      portalDiv.id = 'react-toast-kit-portal';
      portalDiv.style.cssText = `position:fixed;top:0;left:0;width:0;height:0;z-index:${findHighestZIndex()}`;
      if (suppressHydrationWarning) {
        portalDiv.setAttribute('data-suppress-hydration-warning', 'true');
      }
      document.body.appendChild(portalDiv);
    }
    setPortalElement(portalDiv);

    let resizeTimer: number;
    const throttledResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(handleResize, 100);
    };
    window.addEventListener('resize', throttledResize);

    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(resizeTimer);
      if (portalDiv?.parentNode && !document.getElementById('react-toast-kit-portal-static')) {
        document.body.removeChild(portalDiv);
      }
    };
  }, [handleResize, suppressHydrationWarning]);

  const getToastWidth = useCallback((): number => TOAST_WIDTHS[deviceType], [deviceType]);

  const getPositionStyle = useCallback(
    (pos: ToastPosition): React.CSSProperties => {
      const width = getToastWidth();
      const base: React.CSSProperties = { position: 'fixed', width: `${width}px`, display: 'flex', flexDirection: 'column', gap: '0.5rem' };

      if (deviceType === 'mobile') {
        const safe = Math.min(width, screenWidthRef.current - leftOffset - rightOffset);
        base.width = `${safe}px`;
        base.maxWidth = `calc(100vw - ${leftOffset + rightOffset}px)`;
      }

      switch (pos) {
        case 'top-left':    return { ...base, top: `${topOffset}px`, left: `${leftOffset}px`, alignItems: 'flex-start' };
        case 'top-center':  return { ...base, top: `${topOffset}px`, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' };
        case 'top-right':   return { ...base, top: `${topOffset}px`, right: `${rightOffset}px`, alignItems: 'flex-end' };
        case 'bottom-left': return { ...base, bottom: `${bottomOffset}px`, left: `${leftOffset}px`, alignItems: 'flex-start' };
        case 'bottom-center': return { ...base, bottom: `${bottomOffset}px`, left: '50%', transform: 'translateX(-50%)', alignItems: 'center' };
        case 'bottom-right': return { ...base, bottom: `${bottomOffset}px`, right: `${rightOffset}px`, alignItems: 'flex-end' };
        default:            return { ...base, top: `${topOffset}px`, right: `${rightOffset}px`, alignItems: 'flex-end' };
      }
    },
    [getToastWidth, deviceType, leftOffset, rightOffset, topOffset, bottomOffset]
  );

  const toastsByPosition = useMemo(
    () =>
      toasts.reduce<Record<ToastPosition, Toast[]>>((acc, t) => {
        const pos = t.position || 'top-right';
        if (!acc[pos]) acc[pos] = [];
        acc[pos].push(t);
        return acc;
      }, {} as Record<ToastPosition, Toast[]>),
    [toasts]
  );

  if (!isMounted || !portalElement) return null;

  const content = (
    <>
      {enableAccessibleAnnouncements && <AccessibilityAnnouncer toasts={toasts} />}
      {(Object.entries(toastsByPosition) as [ToastPosition, Toast[]][]).map(([pos, posToasts]) => (
        <ToastContainer
          key={pos}
          position={pos}
          toasts={posToasts}
          positionStyle={getPositionStyle(pos)}
          onDismiss={removeToast}
          onPause={pauseToast}
          onResume={resumeToast}
          defaultAnimation={defaultAnimation}
          toastTheme={effectiveTheme}
          defaultStyle={defaultStyle}
          containerClassName={containerClassName}
        />
      ))}
    </>
  );

  return createPortal(
    suppressHydrationWarning ? <div suppressHydrationWarning>{content}</div> : content,
    portalElement
  );
};
ToastPortal.displayName = 'ToastPortal';

export default memo(ToastPortal);
