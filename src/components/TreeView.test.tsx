import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { TreeView } from './TreeView';
import type { TreeNode } from '@/types/tree';

const mockData: TreeNode[] = [
  {
    id: 1,
    name: 'Test Folder',
    selected: false,
    children: [
      {
        id: 2,
        name: 'Test Note',
        selected: false
      }
    ]
  }
];

const mockDataFlat: TreeNode[] = [
  {
    id: 1,
    name: 'First Note',
    selected: false
  },
  {
    id: 2,
    name: 'Second Note',
    selected: false
  },
  {
    id: 3,
    name: 'Third Note',
    selected: false
  },
  {
    id: 4,
    name: 'Fourth Note',
    selected: false
  }
];

const mockDataDeep: TreeNode[] = [
  {
    id: 1,
    name: 'Root Folder',
    selected: false,
    children: [
      {
        id: 2,
        name: 'Sub Folder',
        selected: false,
        children: [
          {
            id: 3,
            name: 'Deep Note',
            selected: false
          }
        ]
      },
      {
        id: 4,
        name: 'Root Level Note',
        selected: false
      }
    ]
  }
];

const mockDataSelected: TreeNode[] = [
  {
    id: 1,
    name: 'Unselected Note',
    selected: false
  },
  {
    id: 2,
    name: 'Selected Note',
    selected: true
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

  describe('node renaming/editing functionality', () => {
    it('enters edit mode when double-clicking a leaf node', async () => {
      const { user } = render(<TreeView data={mockDataFlat} />);

      await user.dblClick(screen.getByText('First Note'));

      // Should show input field in edit mode
      expect(screen.getByDisplayValue('First Note')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('does not enter edit mode when double-clicking a category node', async () => {
      const { user } = render(<TreeView data={mockData} />);

      await user.dblClick(screen.getByText('Test Folder'));

      // Should not show input field for category
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('calls onNodeRename when editing is completed with Enter', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeRename={onNodeRename} />
      );

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Renamed Note');

      // Press Enter to save
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onNodeRename).toHaveBeenCalledWith(mockDataFlat[0], 'Renamed Note');
    });

    it('calls onNodeRename when editing is completed with blur', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeRename={onNodeRename} />
      );

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Blur Renamed Note');

      // Blur the input to save
      fireEvent.blur(input);

      expect(onNodeRename).toHaveBeenCalledWith(mockDataFlat[0], 'Blur Renamed Note');
    });

    it('cancels editing when Escape is pressed', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeRename={onNodeRename} />
      );

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Should Not Save');

      // Press Escape to cancel
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should not call onNodeRename and should show original text
      expect(onNodeRename).not.toHaveBeenCalled();
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not call onNodeRename when name is unchanged', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeRename={onNodeRename} />
      );

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      // Don't change the name, just blur
      fireEvent.blur(input);

      expect(onNodeRename).not.toHaveBeenCalled();
    });

    it('does not call onNodeRename when name is only whitespace', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView data={mockDataFlat} onNodeRename={onNodeRename} />
      );

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, '   ');

      fireEvent.blur(input);

      expect(onNodeRename).not.toHaveBeenCalled();
    });

    it('prevents editing when node is already in editing mode', async () => {
      const { user } = render(<TreeView data={mockDataFlat} />);

      // Enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      // Try to double-click again while editing
      const input = screen.getByDisplayValue('First Note');
      await user.dblClick(input);

      // Should still be in edit mode with the same input
      expect(screen.getAllByRole('textbox')).toHaveLength(1);
    });
  });

  describe('advanced tree operations', () => {
    it('handles deeply nested tree structures', async () => {
      const { user } = render(<TreeView data={mockDataDeep} />);

      // Should show root folder
      expect(screen.getByText('Root Folder')).toBeInTheDocument();

      // Expand root folder
      await user.click(screen.getByText('Root Folder'));
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();
      expect(screen.getByText('Root Level Note')).toBeInTheDocument();

      // Expand sub folder
      await user.click(screen.getByText('Sub Folder'));
      expect(screen.getByText('Deep Note')).toBeInTheDocument();
    });

    it('allows selection of notes at different nesting levels', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView data={mockDataDeep} onNodeSelect={onNodeSelect} />
      );

      // Expand to show all notes
      await user.click(screen.getByText('Root Folder'));
      await user.click(screen.getByText('Sub Folder'));

      // Select root level note
      await user.click(screen.getByText('Root Level Note'));
      expect(onNodeSelect).toHaveBeenCalledWith(mockDataDeep[0].children![1]);

      // Select deep nested note
      await user.click(screen.getByText('Deep Note'));
      expect(onNodeSelect).toHaveBeenCalledWith(
        mockDataDeep[0].children![0].children![0]
      );
    });

    it('maintains expansion state when interacting with other nodes', async () => {
      const { user } = render(<TreeView data={mockDataDeep} />);

      // Expand root folder
      await user.click(screen.getByText('Root Folder'));
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();

      // Expand sub folder
      await user.click(screen.getByText('Sub Folder'));
      expect(screen.getByText('Deep Note')).toBeInTheDocument();

      // Click on deep note (selection, not expansion)
      await user.click(screen.getByText('Deep Note'));

      // Both folders should still be expanded
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();
      expect(screen.getByText('Root Level Note')).toBeInTheDocument();
      expect(screen.getByText('Deep Note')).toBeInTheDocument();
    });

    it('collapses expanded folders when clicked again', async () => {
      const { user } = render(<TreeView data={mockDataDeep} />);

      // Expand root folder
      await user.click(screen.getByText('Root Folder'));
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();

      // Collapse root folder
      await user.click(screen.getByText('Root Folder'));
      expect(screen.queryByText('Sub Folder')).not.toBeInTheDocument();
      expect(screen.queryByText('Root Level Note')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders empty tree without errors', () => {
      render(<TreeView data={[]} title="Empty Tree" />);

      expect(screen.getByText('Empty Tree')).toBeInTheDocument();
      // Should not crash and should show empty tree container
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });

    it('renders single node tree', () => {
      const singleNode: TreeNode[] = [{ id: 1, name: 'Only Node', selected: false }];

      render(<TreeView data={singleNode} />);

      expect(screen.getByText('Only Node')).toBeInTheDocument();
      expect(screen.getByTestId('tree-node-1')).toBeInTheDocument();
    });

    it('handles tree without title', () => {
      render(<TreeView data={mockDataFlat} />);

      // Should show default title
      expect(screen.getByText('Tree')).toBeInTheDocument();
    });

    it('handles tree with empty title', () => {
      render(<TreeView data={mockDataFlat} title="" />);

      // Should not show any title
      expect(screen.queryByText('Tree')).not.toBeInTheDocument();
    });

    it('handles nodes with long names', () => {
      const longNameData: TreeNode[] = [
        {
          id: 1,
          name: 'This is a very long node name that should be handled gracefully by the component',
          selected: false
        }
      ];

      render(<TreeView data={longNameData} />);

      expect(
        screen.getByText(
          'This is a very long node name that should be handled gracefully by the component'
        )
      ).toBeInTheDocument();
    });

    it('handles nodes with special characters in names', () => {
      const specialCharData: TreeNode[] = [
        { id: 1, name: 'Note with "quotes" & symbols!', selected: false },
        { id: 2, name: 'Note with <tags> and {braces}', selected: false }
      ];

      render(<TreeView data={specialCharData} />);

      expect(screen.getByText('Note with "quotes" & symbols!')).toBeInTheDocument();
      expect(screen.getByText('Note with <tags> and {braces}')).toBeInTheDocument();
    });
  });

  describe('node selection state', () => {
    it('shows selected state visually', () => {
      render(<TreeView data={mockDataSelected} />);

      const selectedNode = screen.getByTestId('tree-node-2');
      const unselectedNode = screen.getByTestId('tree-node-1');

      expect(selectedNode).toHaveClass('tree-node-selected');
      expect(unselectedNode).not.toHaveClass('tree-node-selected');
    });

    it('applies correct CSS classes based on node type', () => {
      render(<TreeView data={mockData} />);

      const categoryNode = screen.getByTestId('tree-node-1');
      expect(categoryNode).toHaveClass('tree-node-expandable');
      expect(categoryNode).not.toHaveClass('tree-node-leaf');

      // Expand to see leaf node
      fireEvent.click(screen.getByText('Test Folder'));

      const leafNode = screen.getByTestId('tree-node-2');
      expect(leafNode).toHaveClass('tree-node-leaf');
      expect(leafNode).not.toHaveClass('tree-node-expandable');
    });

    it('does not allow selection of category nodes', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(<TreeView data={mockData} onNodeSelect={onNodeSelect} />);

      // Click on category node (should only expand, not select)
      await user.click(screen.getByText('Test Folder'));

      expect(onNodeSelect).not.toHaveBeenCalled();
      // Should expand instead
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });
  });

  describe('generateName prop functionality', () => {
    it('uses generateName function when provided', () => {
      const generateName = (node: TreeNode) => `Custom: ${node.name}`;

      render(<TreeView data={mockDataFlat} generateName={generateName} />);

      expect(screen.getByText('Custom: First Note')).toBeInTheDocument();
      expect(screen.getByText('Custom: Second Note')).toBeInTheDocument();
    });

    it('falls back to node.name when generateName is not provided', () => {
      render(<TreeView data={mockDataFlat} />);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });
  });

  describe('event handling edge cases', () => {
    it('prevents event bubbling when clicking delete button', async () => {
      const onNodeSelect = vi.fn();
      const onNodeDelete = vi.fn();

      const { user } = render(
        <TreeView
          data={mockDataFlat}
          onNodeSelect={onNodeSelect}
          onNodeDelete={onNodeDelete}
        />
      );

      // Hover to show delete button
      await user.hover(screen.getByText('First Note'));

      // Click delete button
      const deleteButton = screen.getByTestId('delete-node-1');
      fireEvent.click(deleteButton);

      // Delete should be called but not select
      expect(onNodeDelete).toHaveBeenCalledWith(mockDataFlat[0]);
      expect(onNodeSelect).not.toHaveBeenCalled();
    });

    it('prevents event bubbling when clicking expand arrow', async () => {
      const onNodeSelect = vi.fn();

      render(<TreeView data={mockData} onNodeSelect={onNodeSelect} />);

      // Click specifically on the expand arrow
      const expandArrow = screen
        .getByText('Test Folder')
        .parentElement?.querySelector('.tree-expand-arrow');
      expect(expandArrow).toBeInTheDocument();

      fireEvent.click(expandArrow!);

      // Should expand but not call select
      expect(screen.getByText('Test Note')).toBeInTheDocument();
      expect(onNodeSelect).not.toHaveBeenCalled();
    });

    it('handles mousedown events on expand arrow', () => {
      render(<TreeView data={mockData} />);

      const expandArrow = screen
        .getByText('Test Folder')
        .parentElement?.querySelector('.tree-expand-arrow');
      expect(expandArrow).toBeInTheDocument();

      // Should not throw error
      expect(() => {
        fireEvent.mouseDown(expandArrow!);
      }).not.toThrow();
    });
  });
});
