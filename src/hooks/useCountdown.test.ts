import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with the provided count', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ initialCount: 5, onComplete }));

    expect(result.current).toBe(5);
  });

  it('decrements count every second', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ initialCount: 3, onComplete }));

    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(1);
  });

  it('calls onComplete when countdown reaches 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ initialCount: 2, onComplete }));

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops at 0 and does not go negative', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ initialCount: 1, onComplete }));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not start countdown when enabled is false', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialCount: 3, onComplete, enabled: false })
    );

    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current).toBe(3);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('cleans up interval on unmount', () => {
    const onComplete = vi.fn();
    const { result, unmount } = renderHook(() =>
      useCountdown({ initialCount: 5, onComplete })
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(4);

    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it('uses latest onComplete callback', () => {
    const onComplete1 = vi.fn();
    const onComplete2 = vi.fn();

    const { rerender } = renderHook(
      ({ onComplete }) => useCountdown({ initialCount: 2, onComplete }),
      { initialProps: { onComplete: onComplete1 } }
    );

    // Update the callback
    rerender({ onComplete: onComplete2 });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onComplete1).not.toHaveBeenCalled();
    expect(onComplete2).toHaveBeenCalledTimes(1);
  });

  it('handles initialCount of 0', () => {
    const onComplete = vi.fn();
    renderHook(() => useCountdown({ initialCount: 0, onComplete }));

    // Should call onComplete immediately on first tick
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('handles initialCount of 1', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useCountdown({ initialCount: 1, onComplete }));

    expect(result.current).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(0);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('countdown runs independently for multiple hook instances', () => {
    const onComplete1 = vi.fn();
    const onComplete2 = vi.fn();

    const { result: result1 } = renderHook(() =>
      useCountdown({ initialCount: 2, onComplete: onComplete1 })
    );
    const { result: result2 } = renderHook(() =>
      useCountdown({ initialCount: 4, onComplete: onComplete2 })
    );

    expect(result1.current).toBe(2);
    expect(result2.current).toBe(4);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result1.current).toBe(0);
    expect(result2.current).toBe(2);
    expect(onComplete1).toHaveBeenCalledTimes(1);
    expect(onComplete2).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result2.current).toBe(0);
    expect(onComplete2).toHaveBeenCalledTimes(1);
  });
});
