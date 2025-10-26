'use client';

import styles from './notes/MainNotesLayout.module.css';
import Footer from './Footer';

interface AppLayoutClientProps {
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  content?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AppLayoutClient({
  navigation,
  sidebar,
  content,
  children
}: AppLayoutClientProps) {
  return (
    <div className={styles.layout}>
      {navigation}
      <div className={styles.panels}>
        {sidebar}
        {content}
      </div>
      {children}
      <Footer />
    </div>
  );
}
