/**
 * @module hooks/useCountdown
 * @description Custom React hook for countdown timer functionality.
 * Provides a simple countdown timer that automatically calls a callback when reaching zero.
 *
 * @example
 * ```tsx
 * function ResendButton() {
 *   const [canResend, setCanResend] = useState(false);
 *   const countdown = useCountdown({
 *     initialCount: 60,
 *     onComplete: () => setCanResend(true),
 *     enabled: !canResend
 *   });
 *
 *   return (
 *     <button disabled={!canResend}>
 *       {canResend ? 'Resend Email' : `Wait ${countdown}s`}
 *     </button>
 *   );
 * }
 * ```
 */

import { useEffect, useState, useRef } from 'react';

/**
 * Options for useCountdown hook.
 *
 * @interface UseCountdownOptions
 * @property {number} initialCount - Starting countdown value in seconds
 * @property {() => void} onComplete - Callback function to execute when countdown reaches zero
 * @property {boolean} [enabled=true] - Whether the countdown is active
 */
type UseCountdownOptions = {
  initialCount: number;
  onComplete: () => void;
  enabled?: boolean;
};

/**
 * Custom hook for countdown timer functionality.
 * Counts down from initialCount to 0, calling onComplete when finished.
 *
 * @param {UseCountdownOptions} options - Hook configuration options
 * @returns {number} Current countdown value
 *
 * @example
 * ```tsx
 * // Basic countdown
 * const count = useCountdown({
 *   initialCount: 30,
 *   onComplete: () => console.log('Done!')
 * });
 *
 * // Conditional countdown
 * const count = useCountdown({
 *   initialCount: 60,
 *   onComplete: handleComplete,
 *   enabled: isWaiting
 * });
 * ```
 *
 * @remarks
 * - Countdown ticks every 1 second
 * - onComplete callback is stored in ref to avoid stale closures
 * - Timer auto-stops at 0 and calls onComplete
 * - enabled flag allows pausing/resuming countdown
 * - Timer cleanup happens on unmount
 * - Re-initializing requires remounting the component
 */
export function useCountdown({
  initialCount,
  onComplete,
  enabled = true
}: UseCountdownOptions) {
  const [count, setCount] = useState(initialCount);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled]);

  return count;
}
