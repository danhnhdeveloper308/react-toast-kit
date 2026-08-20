import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { cleanup, toast, useToastStore } from './toast';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('toast core', () => {
  it('creates and updates Unicode content', () => {
    const id = toast.success({ title: 'Saved', description: 'Đã lưu thành công' });
    expect(useToastStore.getState().toasts[0]).toMatchObject({ id, variant: 'success' });
    toast.update(id, { description: 'تم الحفظ' });
    expect(useToastStore.getState().toasts[0].description).toBe('تم الحفظ');
  });

  it('respects maxToasts and priority', () => {
    useToastStore.getState().setMaxToasts(2);
    toast({ title: 'Low', priority: 'low', duration: 0 });
    toast({ title: 'High', priority: 'high', duration: 0 });
    toast({ title: 'Normal', duration: 0 });
    const titles = useToastStore
      .getState()
      .toasts.filter((item) => !item.exiting)
      .map((item) => item.title);
    expect(titles).toHaveLength(2);
    expect(titles).toContain('High');
  });

  it('dismisses timed toasts', () => {
    vi.useFakeTimers();
    const id = toast({ description: 'Temporary', duration: 100 });
    vi.advanceTimersByTime(101);
    expect(useToastStore.getState().toasts.find((item) => item.id === id)?.exiting).toBe(true);
    vi.advanceTimersByTime(220);
    expect(useToastStore.getState().toasts.some((item) => item.id === id)).toBe(false);
  });

  it('runs dismissal callbacks after the exit lifecycle', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const id = toast({ description: 'Animated exit', duration: 0, onDismiss });
    toast.dismiss(id);
    expect(useToastStore.getState().toasts[0].exiting).toBe(true);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(220);
    expect(onDismiss).toHaveBeenCalledWith(id);
  });
});

describe('visual contract', () => {
  const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

  it.each([
    'solid',
    'gradient',
    'glass',
    'shimmer',
    'pill',
    'neon',
    'retro',
    'confetti',
    'minimal',
    'outlined',
  ])('ships the %s visual style', (style) => expect(css).toContain(`[data-style='${style}']`));

  it.each(['slide', 'fade', 'bounce', 'flip', 'zoom', 'elastic', 'none'])(
    'ships a distinct %s animation selector',
    (animation) => expect(css).toContain(`[data-animation='${animation}']`)
  );

  it.each([
    'fancy',
    'gradient-wave',
    'pulse',
    'particles',
    'liquid',
    'three-d',
    'dashed',
    'glow',
    'rainbow',
    'data-flow',
    'step-progress',
  ])('ships the %s progress treatment', (style) => expect(css).toContain(`.${style}`));
});
