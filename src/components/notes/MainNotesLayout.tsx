import MainNotesClient from './MainNotesClient';
import styles from './MainNotesLayout.module.css';

interface MainNotesLayoutProps {
  selectedNoteId?: number;
  lineNumber?: number;
}

export default function MainNotesLayout({ lineNumber }: MainNotesLayoutProps) {
  return (
    <div className={styles.layout}>
      <MainNotesClient lineNumber={lineNumber} />
    </div>
  );
}
