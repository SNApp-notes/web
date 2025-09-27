'use client';

import { Button } from '@chakra-ui/react';
import styles from './page.module.css';

export default function Home() {
  const handleOpenGitHub = () => {
    window.open('https://github.com/jcubic/10xDevs', '_blank');
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Hello from 10xDevs</h1>
        <Button
          onClick={handleOpenGitHub}
          size="lg"
          bg="blue.500"
          color="white"
          _hover={{
            bg: 'blue.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg'
          }}
          _active={{
            bg: 'blue.700',
            transform: 'translateY(0)'
          }}
          px={8}
          py={6}
          borderRadius="lg"
          fontWeight="semibold"
          transition="all 0.2s ease-in-out"
        >
          Open GitHub Repository
        </Button>
      </main>
    </div>
  );
}
