'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';
import { system } from '@/theme';

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={system}>
      <NuqsAdapter>
        <ColorModeProvider {...props} />
      </NuqsAdapter>
    </ChakraProvider>
  );
}
