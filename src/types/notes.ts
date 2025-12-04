// Re-export Prisma types
export type { Note, User } from '@/lib/prisma';

// Tree node data types
export interface NoteData {
  content: string | null;
  dirty: boolean;
  createdAt: Date;
  updatedAt: Date;
  contentHash?: string; // Hash of last saved content for undo detection
}

export interface Header {
  id: string;
  text: string;
  content: string;
  line: number;
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

// Sorting types
export enum SortKey {
  CreationTime = 'creationTime',
  Name = 'name',
  UpdateTime = 'updateTime'
}

export enum SortOrder {
  Ascending = 'asc',
  Descending = 'desc'
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
