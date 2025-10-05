'use client';

import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        gray: {
          50: { value: '#fafafa' },
          100: { value: '#f4f4f5' },
          200: { value: '#e4e4e7' },
          300: { value: '#d4d4d8' },
          400: { value: '#a1a1aa' },
          500: { value: '#71717a' },
          600: { value: '#52525b' },
          700: { value: '#3f3f46' },
          800: { value: '#27272a' },
          900: { value: '#18181b' },
          950: { value: '#09090b' }
        },
        blue: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' },
          950: { value: '#172554' }
        }
      }
    },
    semanticTokens: {
      colors: {
        // Background colors
        bg: {
          default: { value: '{colors.white}' },
          _dark: { value: '{colors.gray.900}' }
        },
        'bg.subtle': {
          default: { value: '{colors.gray.50}' },
          _dark: { value: '{colors.gray.800}' }
        },
        'bg.muted': {
          default: { value: '{colors.gray.100}' },
          _dark: { value: '{colors.gray.700}' }
        },

        // Text colors
        fg: {
          default: { value: '{colors.gray.900}' },
          _dark: { value: '{colors.gray.100}' }
        },
        'fg.muted': {
          default: { value: '{colors.gray.600}' },
          _dark: { value: '{colors.gray.400}' }
        },
        'fg.subtle': {
          default: { value: '{colors.gray.500}' },
          _dark: { value: '{colors.gray.500}' }
        },

        // Border colors
        border: {
          default: { value: '{colors.gray.200}' },
          _dark: { value: '{colors.gray.700}' }
        },
        'border.subtle': {
          default: { value: '{colors.gray.100}' },
          _dark: { value: '{colors.gray.800}' }
        },

        // Accent colors (for selection, hover, etc.)
        'accent.bg': {
          default: { value: '{colors.blue.50}' },
          _dark: { value: '{colors.blue.950}' }
        },
        'accent.fg': {
          default: { value: '{colors.blue.700}' },
          _dark: { value: '{colors.blue.300}' }
        },
        'accent.border': {
          default: { value: '{colors.blue.200}' },
          _dark: { value: '{colors.blue.800}' }
        },

        // Interactive states
        'bg.hover': {
          default: { value: '{colors.gray.50}' },
          _dark: { value: '{colors.gray.800}' }
        },
        'bg.active': {
          default: { value: '{colors.gray.100}' },
          _dark: { value: '{colors.gray.700}' }
        }
      }
    }
  }
});

export const system = createSystem(defaultConfig, config);
