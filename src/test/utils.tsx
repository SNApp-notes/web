import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { system } from '@/theme';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChakraProvider value={system}>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </ChakraProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  const user = userEvent.setup();
  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options })
  };
};

export * from '@testing-library/react';
export { customRender as render };
