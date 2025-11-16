import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Provider } from '@/components/ui/provider';
import NotesLayoutWrapper from './NotesLayoutWrapper';
import AppLayoutClient from '@/components/AppLayoutClient';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'SNApp - Smart Note-Taking',
  description:
    'A smart note-taking application with markdown support and intelligent organization',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#5bbad5'
      }
    ]
  },
  manifest: '/site.webmanifest'
};

interface RootLayoutProps {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  content?: React.ReactNode;
}

export default function RootLayout({
  children,
  navigation,
  sidebar,
  content
}: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Provider>
          <NotesLayoutWrapper>
            <AppLayoutClient navigation={navigation} sidebar={sidebar} content={content}>
              {children}
            </AppLayoutClient>
          </NotesLayoutWrapper>
        </Provider>
      </body>
    </html>
  );
}
