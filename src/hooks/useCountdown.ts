import { useEffect, useState, useRef } from 'react';

type UseCountdownOptions = {
  initialCount: number;
  onComplete: () => void;
  enabled?: boolean;
};

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
