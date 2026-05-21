let debugEnabled: boolean | null = null;

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (debugEnabled === null) {
    debugEnabled = new URLSearchParams(window.location.search).has('debug');
  }
  return debugEnabled;
}

export function resetDebugFlag() {
  debugEnabled = null;
}

export function debug(label: string, ...args: unknown[]) {
  if (isDebugEnabled()) {
    console.log(`[DEBUG][${label}]`, ...args);
  }
}
