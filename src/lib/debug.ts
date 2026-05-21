const STORAGE_KEY = 'debug';

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function enableDebug() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export function disableDebug() {
  localStorage.removeItem(STORAGE_KEY);
}

export function debug(label: string, ...args: unknown[]) {
  if (isDebugEnabled()) {
    console.log(`[DEBUG][${label}]`, ...args);
  }
}
