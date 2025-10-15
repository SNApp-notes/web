import { describe, it, expect } from 'vitest';

// Mock function to simulate the counter logic
function simulateNoteCounter(existingNames: string[], baseName: string): string {
  const sanitizedBaseName = baseName.trim() || 'New Note';

  if (existingNames.length === 0) {
    return sanitizedBaseName;
  }

  // Extract counters from existing names
  const counters = existingNames
    .map((name) => {
      const match = name.match(new RegExp(`^${sanitizedBaseName}\\s(\\d+)$`));
      return match ? parseInt(match[1]) : name === sanitizedBaseName ? 0 : -1;
    })
    .filter((counter) => counter >= 0);

  const highestCounter = counters.length > 0 ? Math.max(...counters) : 0;
  const nextCounter = highestCounter + 1;

  return `${sanitizedBaseName} ${nextCounter}`;
}

describe('Note Creation Counter Logic', () => {
  it('should create "New Note" for first note', () => {
    const result = simulateNoteCounter([], 'New Note');
    expect(result).toBe('New Note');
  });

  it('should create "New Note 1" when "New Note" exists', () => {
    const result = simulateNoteCounter(['New Note'], 'New Note');
    expect(result).toBe('New Note 1');
  });

  it('should create "New Note 3" when "New Note", "New Note 1", "New Note 2" exist', () => {
    const result = simulateNoteCounter(
      ['New Note', 'New Note 1', 'New Note 2'],
      'New Note'
    );
    expect(result).toBe('New Note 3');
  });

  it('should handle gaps in numbering', () => {
    const result = simulateNoteCounter(
      ['New Note', 'New Note 5', 'Other Note'],
      'New Note'
    );
    expect(result).toBe('New Note 6');
  });

  it('should sanitize special characters', () => {
    const baseName = 'Note<>:"/\\|?*';
    const sanitized = baseName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim() || 'New Note';
    expect(sanitized).toBe('Note');
  });
});
