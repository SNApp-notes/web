import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { TreeView } from './TreeView';
import type { TreeNode } from '@/types/tree';

const mockData: TreeNode[] = [
  {
    id: 1,
    name: 'Test Folder',
    children: [
      {
        id: 2,
        name: 'Test Note'
      }
    ]
  }
];

const mockDataFlat: TreeNode[] = [
  {
    id: 1,
    name: 'First Note'
  },
  {
    id: 2,
    name: 'Second Note'
  },
  {
    id: 3,
    name: 'Third Note'
  },
  {
    id: 4,
    name: 'Fourth Note'
  }
];

describe('TreeView', () => {
  it('renders tree structure correctly', () => {
    render(<TreeView data={mockData} />);

    expect(screen.getByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<TreeView data={mockData} title="My Custom Tree" />);

    expect(screen.getByText('My Custom Tree')).toBeInTheDocument();
    expect(screen.getByText('Test Folder')).toBeInTheDocument();
  });

  it('expands folder when clicked', async () => {
    const { user } = render(<TreeView data={mockData} />);

    const folder = screen.getByText('Test Folder');
    await user.click(folder);

    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('calls onNodeSelect when note is clicked', async () => {
    const onNodeSelect = vi.fn();
    const { user } = render(<TreeView data={mockData} onNodeSelect={onNodeSelect} />);

    // First expand the folder
    await user.click(screen.getByText('Test Folder'));

    // Then click the note
    await user.click(screen.getByText('Test Note'));

    expect(onNodeSelect).toHaveBeenCalledWith(mockData[0].children![0]);
  });

  describe('flat notes without categories', () => {
    it('renders all flat notes correctly', () => {
      render(<TreeView data={mockDataFlat} title="Flat Notes" />);

      expect(screen.getByText('Flat Notes')).toBeInTheDocument();
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
      expect(screen.getByText('Third Note')).toBeInTheDocument();
      expect(screen.getByText('Fourth Note')).toBeInTheDocument();
    });

    it('allows selecting flat notes without expanding', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeSelect={onNodeSelect} />
      );

      // Click the second note directly (no need to expand)
      await user.click(screen.getByText('Second Note'));

      expect(onNodeSelect).toHaveBeenCalledWith(mockDataFlat[1]);
    });

    it('shows file icons for flat notes', () => {
      const { container } = render(<TreeView data={mockDataFlat} />);

      // Check that all notes are visible and have the file icon class
      const fileIcons = container.querySelectorAll('.tree-node-icon');
      expect(fileIcons).toHaveLength(4);
    });

    it('calls onNodeSelect for each flat note when clicked', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeSelect={onNodeSelect} />
      );

      // Click each note and verify the callback is called with correct data
      await user.click(screen.getByText('First Note'));
      expect(onNodeSelect).toHaveBeenCalledWith(mockDataFlat[0]);

      await user.click(screen.getByText('Third Note'));
      expect(onNodeSelect).toHaveBeenCalledWith(mockDataFlat[2]);

      await user.click(screen.getByText('Fourth Note'));
      expect(onNodeSelect).toHaveBeenCalledWith(mockDataFlat[3]);

      expect(onNodeSelect).toHaveBeenCalledTimes(3);
    });
  });

  describe('delete functionality', () => {
    it('shows delete button on hover for leaf nodes', async () => {
      const onNodeDelete = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeDelete={onNodeDelete} />
      );

      // Hover over a note to show delete button
      await user.hover(screen.getByText('First Note'));

      // Check if delete button appears
      expect(screen.getByTestId('delete-node-1')).toBeInTheDocument();
    });

    it('does not show delete button for category nodes', async () => {
      const onNodeDelete = vi.fn();
      const { user } = render(<TreeView data={mockData} onNodeDelete={onNodeDelete} />);

      // Hover over category node
      await user.hover(screen.getByText('Test Folder'));

      // Delete button should not be present for categories
      expect(screen.queryByTestId('delete-node-1')).not.toBeInTheDocument();
    });

    it('calls onNodeDelete when delete button is clicked', async () => {
      const onNodeDelete = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeDelete={onNodeDelete} />
      );

      // Hover over note to show delete button
      await user.hover(screen.getByText('First Note'));

      // Check if delete button is there before clicking
      const deleteButton = screen.getByTestId('delete-node-1');

      // Try clicking directly with fireEvent
      fireEvent.click(deleteButton);

      expect(onNodeDelete).toHaveBeenCalledWith(mockDataFlat[0]);
    });

    it('does not show delete button when onNodeDelete is not provided', async () => {
      const { user } = render(<TreeView data={mockDataFlat} />);

      // Hover over note
      await user.hover(screen.getByText('First Note'));

      // Delete button should not appear when no delete handler is provided
      expect(screen.queryByTestId('delete-node-1')).not.toBeInTheDocument();
    });
  });
});
