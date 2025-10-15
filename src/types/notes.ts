// Re-export Prisma types
export type { Note, User } from '@prisma/client';

export interface Header {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6; // H1-H6
  line: number;
  children?: Header[];
}

// UI State types
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface FilterState {
  notes: string;
  headers: string;
}

export interface SelectionState {
  noteId: number | null;
  lineNumber?: number;
}

export interface SessionExpiry {
  isExpired: boolean;
  expiresAt?: Date;
}

// Component-specific types
export interface TreeViewNode {
  id: number;
  label: string;
  isSelected: boolean;
  hasUnsavedChanges: boolean;
}

export interface EditorState {
  content: string;
  hasChanges: boolean;
  cursorPosition: number;
  scrollPosition: number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  editorTheme: unknown; // CodeMirror Extension type
}

export interface HeaderLevel {
  level: number;
  indentation: string;
}

export interface NavigationClick {
  headerId: string;
  lineNumber: number;
}

export interface HeaderFilter {
  value: string;
  isActive: boolean;
}

export interface NavigationState {
  currentHeader?: string;
  scrollPosition: number;
}
