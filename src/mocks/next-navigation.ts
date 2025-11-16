import { vi } from 'vitest';

export const createMockRouter = () => ({
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn()
});

export const useRouter = vi.fn(() => createMockRouter());
export const usePathname = vi.fn(() => '/');
export const useParams = vi.fn(() => ({}));
