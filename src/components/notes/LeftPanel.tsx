'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Button, Input, Stack, Text } from '@chakra-ui/react';
import { FiFileText, FiCircle } from 'react-icons/fi';
import clsx from 'clsx';
import type { Note } from '@prisma/client';
import { useNotesContext } from './NotesContext';

interface LeftPanelProps {
  notes: Note[];
  selectedNoteId: number | null;
  onNoteSelect: (id: number) => void;
  onNewNote: () => void;
  onDeleteNote?: (id: number) => void;
  onRenameNote?: (id: number, newName: string) => Promise<void>;
}

export default function LeftPanel({
  notes,
  selectedNoteId,
  onNoteSelect,
  onNewNote,
  onDeleteNote,
  onRenameNote
}: LeftPanelProps) {
  const [filter, setFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const { hasUnsavedChanges } = useNotesContext();
  const listRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const filteredNotes = notes.filter((note) =>
    note.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== listRef.current && !listRef.current?.contains(e.target as Node)) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, filteredNotes.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredNotes.length) {
            onNoteSelect(filteredNotes[focusedIndex].id);
          }
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredNotes.length && onDeleteNote) {
            const noteToDelete = filteredNotes[focusedIndex];
            if (window.confirm(`Delete note "${noteToDelete.name}"?`)) {
              onDeleteNote(noteToDelete.id);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredNotes, onNoteSelect, onDeleteNote]);

  // Reset focus when filter changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filter]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingNoteId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNoteId]);

  const handleDoubleClick = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingName(note.name);
  };

  const handleRenameSubmit = async () => {
    if (!editingNoteId || !onRenameNote) {
      cancelRename();
      return;
    }

    const trimmedName = editingName.trim();

    // Validation: empty names revert to original
    if (!trimmedName) {
      cancelRename();
      return;
    }

    // Validation: max length (matches backend limit)
    if (trimmedName.length > 255) {
      setEditingName(trimmedName.substring(0, 255));
      return;
    }

    // Find the original note to compare names
    const originalNote = notes.find((n) => n.id === editingNoteId);
    if (originalNote && trimmedName === originalNote.name) {
      // No change needed
      cancelRename();
      return;
    }

    try {
      await onRenameNote(editingNoteId, trimmedName);
      setEditingNoteId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename note:', error);
      cancelRename();
    }
  };

  const cancelRename = () => {
    setEditingNoteId(null);
    setEditingName('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

  return (
    <Box as="aside" h="100%" display="flex" flexDirection="column" p={4} bg="bg.subtle">
      <Stack gap={4} align="stretch">
        <Button colorPalette="blue" variant="solid" onClick={onNewNote}>
          New Note
        </Button>

        <Input
          p={3}
          placeholder="Filter notes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="sm"
        />
      </Stack>

      <Box
        ref={listRef}
        flex={1}
        mt={4}
        overflow="auto"
        tabIndex={0}
        _focus={{ outline: 'none' }}
      >
        {filteredNotes.length === 0 ? (
          <Text textAlign="center" color="fg.muted" fontSize="sm">
            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
          </Text>
        ) : (
          <Stack gap={1} align="stretch">
            {filteredNotes.map((note, index) => {
              const isSelected = selectedNoteId === note.id;
              const isFocused = focusedIndex === index;
              const hasChanges = isSelected && hasUnsavedChanges;

              return (
                <Box
                  key={note.id}
                  p={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={isSelected ? 'blue.solid' : isFocused ? 'bg.muted' : 'transparent'}
                  color={isSelected ? 'white' : 'fg'}
                  border={isFocused ? '1px solid' : '1px solid transparent'}
                  borderColor={isFocused ? 'border.emphasized' : 'transparent'}
                  className={clsx('tree-node', {
                    'tree-node-selected': isSelected,
                    'tree-node-focused': isFocused,
                    'tree-node-leaf': true
                  })}
                  _hover={{
                    bg: isSelected ? 'blue.solid' : 'bg.muted'
                  }}
                  onClick={() => onNoteSelect(note.id)}
                  data-testid={`note-item-${note.id}`}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <FiFileText size={14} color="currentColor" />
                    {editingNoteId === note.id ? (
                      <Input
                        ref={editInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleEditKeyDown}
                        fontSize="sm"
                        fontWeight="medium"
                        size="sm"
                        variant="flushed"
                        flex={1}
                        minH="auto"
                        h="auto"
                        p={0}
                        bg="transparent"
                        border="none"
                        borderBottom="1px solid"
                        borderColor="border.emphasized"
                        borderRadius={0}
                        _focus={{ borderColor: 'blue.500', boxShadow: 'none' }}
                      />
                    ) : (
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        lineClamp={1}
                        flex={1}
                        onDoubleClick={() => handleDoubleClick(note)}
                        cursor="pointer"
                        userSelect="none"
                      >
                        {note.name}
                      </Text>
                    )}
                    {hasChanges && <FiCircle size={8} color="orange" fill="orange" />}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
