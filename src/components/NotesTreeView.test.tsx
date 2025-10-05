import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { NotesTreeView } from './NotesTreeView';
import type { TreeNode } from '@/types/tree';

const mockData: TreeNode[] = [
  {
    id: '1',
    name: 'Test Folder',
    type: 'category',
    children: [
      {
        id: '2',
        name: 'Test Note',
        type: 'note',
        content: 'Test content',
        createdAt: new Date('2024-01-01'),
        parentId: '1'
      }
    ],
    createdAt: new Date('2024-01-01')
  }
];

describe('NotesTreeView', () => {
  it('renders tree structure correctly', () => {
    render(<NotesTreeView data={mockData} />);

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('expands folder when clicked', async () => {
    const { user } = render(<NotesTreeView data={mockData} />);

    const folder = screen.getByText('Test Folder');
    await user.click(folder);

    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('calls onNodeSelect when note is clicked', async () => {
    const onNodeSelect = vi.fn();
    const { user } = render(
      <NotesTreeView data={mockData} onNodeSelect={onNodeSelect} />
    );

    // First expand the folder
    await user.click(screen.getByText('Test Folder'));

    // Then click the note
    await user.click(screen.getByText('Test Note'));

    expect(onNodeSelect).toHaveBeenCalledWith(mockData[0].children![0]);
  });
});
