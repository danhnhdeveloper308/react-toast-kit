import * as React from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from './toast';
import type { Toast, ToastPosition, ToastAnimation, ToastStyle, ToastAction } from './toast';

const { useEffect, useLayoutEffect, useState, memo, useRef, useCallback, useMemo } = React;

type ToastCSSProperties = React.CSSProperties & Record<`--${string}`, string | number | undefined>;

const toNativeKeyframe = (value: Record<string, unknown>): Keyframe => {
  const { x, y, scale, rotate, rotateX, rotateY, ...native } = value;
  const transforms: string[] = [];
  if (x !== undefined || y !== undefined) {
    transforms.push(`translate3d(${x ?? 0}px, ${y ?? 0}px, 0)`);
  }
  if (scale !== undefined) transforms.push(`scale(${scale})`);
  if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`);
  if (rotateX !== undefined) transforms.push(`rotateX(${rotateX}deg)`);
  if (rotateY !== undefined) transforms.push(`rotateY(${rotateY}deg)`);
  return {
    ...native,
    ...(transforms.length ? { transform: transforms.join(' ') } : {}),
  } as Keyframe;
};

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
    const latest = [...toasts]
      .filter((toast) => !toast.exiting)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latest) return;
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
    <div
      aria-live={
        toasts.some((toast) => toast.variant === 'error' && !toast.exiting) ? 'assertive' : 'polite'
      }
      aria-atomic="true"
      className="sr-only"
      role={
        toasts.some((toast) => toast.variant === 'error' && !toast.exiting) ? 'alert' : 'status'
      }
    >
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
const ProgressBar = memo(
  ({
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
    const isVertical = progressBarPosition === 'left' || progressBarPosition === 'right';
    const fillRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<number | null>(null);
    const elapsedRef = useRef(0);
    const startedRef = useRef(0);
    const mobileClockRef = useRef(false);
    const pausedRef = useRef(isPaused);
    pausedRef.current = isPaused;
    const timingFunction =
      progressAnimation === 'spring' ? 'cubic-bezier(.2,.8,.2,1)' : progressAnimation || 'linear';

    const startMobileClock = useCallback(() => {
      const fill = fillRef.current;
      if (!fill || frameRef.current !== null || elapsedRef.current >= duration) return;
      startedRef.current = performance.now();
      const tick = (now: number) => {
        const elapsed = elapsedRef.current + now - startedRef.current;
        const progress = Math.max(0, 1 - elapsed / duration);
        fill.style.transform = isVertical ? `scaleY(${progress})` : `scaleX(${progress})`;
        if (elapsed < duration && !pausedRef.current) {
          frameRef.current = requestAnimationFrame(tick);
        } else {
          if (elapsed >= duration) elapsedRef.current = duration;
          frameRef.current = null;
        }
      };
      frameRef.current = requestAnimationFrame(tick);
    }, [duration, isVertical]);

    useLayoutEffect(() => {
      const fill = fillRef.current;
      if (!fill) return;

      mobileClockRef.current = window.matchMedia?.('(hover: none)').matches ?? false;
      if (!mobileClockRef.current) return;
      fill.style.setProperty('animation', 'none', 'important');
      fill.style.transform = isVertical ? 'scaleY(1)' : 'scaleX(1)';
      elapsedRef.current = 0;
      if (!pausedRef.current) startMobileClock();

      return () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        elapsedRef.current = 0;
        mobileClockRef.current = false;
        fill.style.removeProperty('animation');
        fill.style.removeProperty('transform');
      };
    }, [isVertical, startMobileClock]);

    useLayoutEffect(() => {
      if (!mobileClockRef.current) return;
      if (isPaused && frameRef.current !== null) {
        elapsedRef.current += performance.now() - startedRef.current;
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      } else if (!isPaused) {
        startMobileClock();
      }
    }, [isPaused, startMobileClock]);

    const baseClass = `react-toast-progress${progressBarStyle ? ` ${progressBarStyle}` : ''}`;

    return (
      <div
        className={baseClass}
        style={
          {
            '--rtk-progress-size': progressBarThickness
              ? `${Math.max(3, progressBarThickness)}px`
              : undefined,
            '--rtk-progress-color': progressBarColor || undefined,
            '--rtk-progress-duration': `${duration}ms`,
          } as ToastCSSProperties
        }
      >
        <div
          ref={fillRef}
          className="react-toast-progress-fill"
          style={
            {
              backgroundColor: progressBarColor || undefined,
              transformOrigin: isVertical ? 'top center' : 'left center',
              animationDuration: `${duration}ms`,
              animationTimingFunction: timingFunction,
              animationPlayState: isPaused ? 'paused' : 'running',
              '--toast-progress-start': isVertical ? 'scaleY(1)' : 'scaleX(1)',
              '--toast-progress-axis': isVertical ? 'scaleY(0)' : 'scaleX(0)',
            } as ToastCSSProperties
          }
        />
        <span
          className="react-toast-progress-orb"
          style={{
            animationDuration: `${duration}ms`,
            animationTimingFunction: timingFunction,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = 'ProgressBar';

// ─── ToastItem ───────────────────────────────────────────────────────────────

const ToastItem = memo(
  ({
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

    useEffect(() => {
      if (!toast.customAnimation || !toastRef.current || toast.exiting) return;
      const transition = toast.customAnimation.transition || {};
      const duration = Number(transition.duration);
      const animation = toastRef.current.animate(
        [
          toNativeKeyframe(toast.customAnimation.initial),
          toNativeKeyframe(toast.customAnimation.animate),
        ],
        {
          duration: Number.isFinite(duration) ? duration * 1000 : 320,
          easing:
            typeof transition.ease === 'string' ? transition.ease : 'cubic-bezier(.2,.8,.2,1)',
          fill: 'both',
        }
      );
      return () => animation.cancel();
    }, [toast.customAnimation, toast.exiting]);

    useEffect(() => {
      if (!toast.customAnimation || !toastRef.current || !toast.exiting) return;
      const transition = toast.customAnimation.transition || {};
      const duration = Number(transition.duration);
      toastRef.current.animate(
        [
          toNativeKeyframe(toast.customAnimation.animate),
          toNativeKeyframe(toast.customAnimation.exit),
        ],
        {
          duration: Number.isFinite(duration) ? duration * 1000 : 220,
          easing: typeof transition.ease === 'string' ? transition.ease : 'ease-in',
          fill: 'forwards',
        }
      );
    }, [toast.customAnimation, toast.exiting]);

    // Subscribe only to this toast's pause state to avoid re-rendering all items
    const isPaused = useToastStore((state) => state.pausedToasts.has(toast.id));

    const handleDismiss = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

    const handlePause = useCallback(
      (event: React.PointerEvent) => {
        // Mobile browsers may synthesize a sticky mouse/empty pointer event
        // without a matching leave. Pause only for a real fine-hover mouse.
        const hasMouseHover =
          event.pointerType === 'mouse' &&
          window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
        if (toast.pauseOnHover && hasMouseHover) onPause(toast.id);
      },
      [onPause, toast.id, toast.pauseOnHover]
    );

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
        success: [
          isDark ? 'rgba(5,95,70,.9)' : 'rgba(16,185,129,.8)',
          isDark ? 'rgba(4,120,87,.8)' : 'rgba(5,150,105,.7)',
        ],
        error: [
          isDark ? 'rgba(153,27,27,.9)' : 'rgba(239,68,68,.8)',
          isDark ? 'rgba(185,28,28,.8)' : 'rgba(220,38,38,.7)',
        ],
        warning: [
          isDark ? 'rgba(146,64,14,.9)' : 'rgba(245,158,11,.8)',
          isDark ? 'rgba(180,83,9,.8)' : 'rgba(217,119,6,.7)',
        ],
        info: [
          isDark ? 'rgba(30,64,175,.9)' : 'rgba(59,130,246,.8)',
          isDark ? 'rgba(29,78,216,.8)' : 'rgba(37,99,235,.7)',
        ],
      };
      const [from, to] = map[toast.variant] ?? [
        isDark ? 'rgba(55,65,81,.9)' : 'rgba(229,231,235,.8)',
        isDark ? 'rgba(75,85,99,.8)' : 'rgba(209,213,219,.7)',
      ];
      return { '--toast-gradient-from': from, '--toast-gradient-to': to } as React.CSSProperties;
    }, [toast.variant, toast.visualStyle, toastTheme, defaultStyle]);

    const additionalClasses = useMemo(() => {
      const classes: string[] = [];
      if (toast.floating) classes.push('react-toast-floating');
      if (toast.rippleEffect) classes.push('toast-ripple');
      const vs = toast.visualStyle || defaultStyle;
      if (vs === 'glass' || vs === 'gradient') classes.push('toast-soft-shadow');
      return classes.join(' ');
    }, [toast.floating, toast.rippleEffect, toast.visualStyle, defaultStyle]);

    const progressBarClasses = useMemo(() => {
      return toast.progressBarStyle || 'default';
    }, [toast.progressBarStyle]);

    const swipeGesture = useSwipeGesture(toast.swipeToDismiss || false, handleDismiss);

    return (
      <div
        key={toast.id}
        className="react-toast-item w-full"
        data-animation={toast.animation || animation}
        data-position={toast.position || position}
        data-updating={toast.updating || undefined}
        data-exiting={toast.exiting || undefined}
        aria-hidden={toast.exiting || undefined}
        style={{ animationDelay: toast.stagger ? `${toast.stagger}ms` : undefined }}
      >
        <div
          ref={toastRef}
          role="group"
          aria-label={`${toast.variant} notification`}
          className={`relative overflow-hidden shadow-lg rounded-lg react-toast w-full ${toast.className || ''} ${additionalClasses}`}
          style={{ ...(toast.style || {}), ...variantStyles }}
          onPointerEnter={handlePause}
          onPointerLeave={handleResume}
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
                  <div className="flex-shrink-0 mr-3 toast-icon-container toast-icon-animated">
                    {toast.icon}
                  </div>
                ) : toast.iconString ? (
                  <div className="flex-shrink-0 mr-3 toast-icon-container toast-icon-animated">
                    <SVGIcon svgString={toast.iconString} />
                  </div>
                ) : null}

                <div className="flex-1">
                  {toast.title && <h4 className="font-medium mb-1">{toast.title}</h4>}
                  {toast.description && (
                    <div className="toast-description">{toast.description}</div>
                  )}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss();
                    }}
                    className="react-toast-close"
                    aria-label="Close notification"
                    data-dismiss="toast"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ToastItem.displayName = 'ToastItem';

// ─── ToastContainer ───────────────────────────────────────────────────────────

const ToastContainer = memo(
  ({
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
    </div>
  )
);
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
      width < DEVICE_BREAKPOINTS.mobile
        ? 'mobile'
        : width < DEVICE_BREAKPOINTS.tablet
          ? 'tablet'
          : 'desktop';
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
      const base: React.CSSProperties = {
        position: 'fixed',
        width: `${width}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      };

      if (deviceType === 'mobile') {
        const safe = Math.min(width, screenWidthRef.current - leftOffset - rightOffset);
        base.width = `${safe}px`;
        base.maxWidth = `calc(100vw - ${leftOffset + rightOffset}px)`;
      }

      switch (pos) {
        case 'top-left':
          return {
            ...base,
            top: `${topOffset}px`,
            left: `${leftOffset}px`,
            alignItems: 'flex-start',
          };
        case 'top-center':
          return {
            ...base,
            top: `${topOffset}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            alignItems: 'center',
          };
        case 'top-right':
          return {
            ...base,
            top: `${topOffset}px`,
            right: `${rightOffset}px`,
            alignItems: 'flex-end',
          };
        case 'bottom-left':
          return {
            ...base,
            bottom: `${bottomOffset}px`,
            left: `${leftOffset}px`,
            alignItems: 'flex-start',
          };
        case 'bottom-center':
          return {
            ...base,
            bottom: `${bottomOffset}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            alignItems: 'center',
          };
        case 'bottom-right':
          return {
            ...base,
            bottom: `${bottomOffset}px`,
            right: `${rightOffset}px`,
            alignItems: 'flex-end',
          };
        default:
          return {
            ...base,
            top: `${topOffset}px`,
            right: `${rightOffset}px`,
            alignItems: 'flex-end',
          };
      }
    },
    [getToastWidth, deviceType, leftOffset, rightOffset, topOffset, bottomOffset]
  );

  const toastsByPosition = useMemo(
    () =>
      toasts.reduce<Record<ToastPosition, Toast[]>>(
        (acc, t) => {
          const pos = t.position || 'top-right';
          if (!acc[pos]) acc[pos] = [];
          acc[pos].push(t);
          return acc;
        },
        {} as Record<ToastPosition, Toast[]>
      ),
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
