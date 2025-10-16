'use client';

import { Box, Text } from '@chakra-ui/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="bg.subtle"
      borderTop="1px solid"
      borderColor="border"
      py={1}
      px={4}
      flexShrink={0}
      height="auto"
    >
      <Text fontSize="xs" color="fg.muted" textAlign="center">
        Copyright (C) {currentYear}{' '}
        <a href="https://jakub.jankiewicz.org/">Jakub T. Jankiewicz</a>{' '}
        &lt;jcubic@onet.pl&gt; | AGPL-3.0-or-later
      </Text>
    </Box>
  );
}
