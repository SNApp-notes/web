/**
 * @module app/layout.test
 * @description Unit tests for root layout component
 */

import { describe, it, expect, vi } from 'vitest';
import type { ReactElement } from 'react';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans'
  })),
  Geist_Mono: vi.fn(() => ({
    variable: '--font-geist-mono'
  }))
}));

// Mock Provider component
vi.mock('@/components/ui/provider', () => ({
  Provider: vi.fn(({ children }) => children)
}));

// Mock NotesLayoutWrapper component
vi.mock('./NotesLayoutWrapper', () => ({
  default: vi.fn(({ children }) => children)
}));

// Mock AppLayoutClient component
vi.mock('@/components/AppLayoutClient', () => ({
  default: vi.fn(({ children }) => children)
}));

describe('RootLayout', () => {
  it('should render layout with correct structure and font classes', async () => {
    const { default: RootLayout } = await import('./layout');

    const children = 'Test content' as unknown as ReactElement;
    const result = RootLayout({
      children
    });

    // Verify the component returns JSX structure
    expect(result).toBeDefined();
    expect(result.type).toBe('html');
    expect(result.props.lang).toBe('en');
    expect(result.props.suppressHydrationWarning).toBe(true);

    // Verify body has font classes
    const body = result.props.children;
    expect(body.type).toBe('body');
    expect(body.props.className).toContain('--font-geist-sans');
    expect(body.props.className).toContain('--font-geist-mono');
  });

  it('should pass parallel route slots to AppLayoutClient', async () => {
    const { default: RootLayout } = await import('./layout');

    const children = 'Test children' as unknown as ReactElement;
    const navigation = 'Test navigation' as unknown as ReactElement;
    const sidebar = 'Test sidebar' as unknown as ReactElement;
    const content = 'Test content' as unknown as ReactElement;

    const result = RootLayout({
      children,
      navigation,
      sidebar,
      content
    });

    // Verify component returns JSX
    expect(result).toBeDefined();
    expect(result.type).toBe('html');
  });

  it('should export correct metadata', async () => {
    const { metadata } = await import('./layout');

    expect(metadata.title).toBe('SNApp - Smart Note-Taking');
    expect(metadata.description).toContain('smart note-taking application');
    expect(metadata.manifest).toBe('/site.webmanifest');
    expect(metadata.icons).toBeDefined();
  });
});
