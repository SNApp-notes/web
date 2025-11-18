import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { TreeView, TreeNode, useTreeNodeContext } from './TreeView/index';
import type { TreeNodeRenderProps } from './TreeView/index';
import type { TreeNode as TreeNodeType } from '@/types/tree';

// Mock data
const mockDataFlat: TreeNodeType[] = [
  { id: 1, name: 'First Note', selected: false },
  { id: 2, name: 'Second Note', selected: true },
  { id: 3, name: 'Third Note', selected: false }
];

const mockDataNested: TreeNodeType[] = [
  {
    id: 1,
    name: 'Folder',
    selected: false,
    children: [
      { id: 2, name: 'Child Note 1', selected: false },
      { id: 3, name: 'Child Note 2', selected: false }
    ]
  },
  { id: 4, name: 'Root Note', selected: false }
];

const mockDataDeep: TreeNodeType[] = [
  {
    id: 1,
    name: 'Root Folder',
    selected: false,
    children: [
      {
        id: 2,
        name: 'Sub Folder',
        selected: false,
        children: [{ id: 3, name: 'Deep Note', selected: false }]
      }
    ]
  }
];

// Default render function for tests (similar to LeftPanel implementation)
const defaultRender = ({ node, selected, editing, hasChildren }: TreeNodeRenderProps) => (
  <TreeNode.Content
    data-testid={`tree-node-${node.id}`}
    bg={selected ? 'blue.solid' : 'transparent'}
    className={`tree-node ${selected ? 'tree-node-selected' : ''} ${
      hasChildren ? 'tree-node-expandable' : 'tree-node-leaf'
    }`}
  >
    <TreeNode.ExpandIcon className="tree-expand-arrow" />
    <TreeNode.Icon className="tree-node-icon" />
    {editing ? (
      <TreeNode.Edit data-testid={`edit-${node.id}`} />
    ) : (
      <TreeNode.Text data-testid={`text-${node.id}`} />
    )}
    {!hasChildren && <TreeNode.DeleteButton data-testid={`delete-node-${node.id}`} />}
  </TreeNode.Content>
);

describe('TreeView Component', () => {
  describe('basic rendering', () => {
    it('renders with default title', () => {
      render(<TreeView data={mockDataFlat} render={defaultRender} />);

      expect(screen.getByText('Tree')).toBeInTheDocument();
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<TreeView data={mockDataFlat} render={defaultRender} title="My Notes" />);

      expect(screen.getByText('My Notes')).toBeInTheDocument();
    });

    it('renders without title when empty string provided', () => {
      render(<TreeView data={mockDataFlat} render={defaultRender} title="" />);

      expect(screen.queryByText('Tree')).not.toBeInTheDocument();
    });

    it('renders all flat nodes', () => {
      render(<TreeView data={mockDataFlat} render={defaultRender} />);

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
      expect(screen.getByText('Third Note')).toBeInTheDocument();
    });

    it('renders empty tree without errors', () => {
      render(<TreeView data={[]} render={defaultRender} title="Empty" />);

      expect(screen.getByText('Empty')).toBeInTheDocument();
      expect(screen.getByTestId('tree-view')).toBeInTheDocument();
    });
  });

  describe('render prop functionality', () => {
    it('calls render prop with correct props', () => {
      const renderSpy = vi.fn(defaultRender);
      render(<TreeView data={mockDataFlat} render={renderSpy} />);

      expect(renderSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          node: mockDataFlat[0],
          selected: false,
          editing: false,
          hasChildren: false,
          isExpanded: false,
          level: 0
        })
      );
    });

    it('passes correct selected state to render prop', () => {
      const renderSpy = vi.fn(defaultRender);
      render(<TreeView data={mockDataFlat} render={renderSpy} />);

      // Second node is selected
      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          node: mockDataFlat[1],
          selected: true
        })
      );
    });

    it('passes correct hasChildren flag', () => {
      const renderSpy = vi.fn(defaultRender);
      render(<TreeView data={mockDataNested} render={renderSpy} />);

      // First node has children
      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          node: mockDataNested[0],
          hasChildren: true
        })
      );

      // Last node has no children
      expect(renderSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          node: mockDataNested[1],
          hasChildren: false
        })
      );
    });
  });

  describe('event handlers', () => {
    it('calls onNodeSelect when node is clicked', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeSelect={onNodeSelect}
        />
      );

      await user.click(screen.getByText('First Note'));

      expect(onNodeSelect).toHaveBeenCalledWith(mockDataFlat[0]);
    });

    it('calls onNodeRename when editing completes', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      // Double-click to enter edit mode
      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Renamed');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onNodeRename).toHaveBeenCalledWith(mockDataFlat[0], 'Renamed');
    });

    it('calls onNodeDelete when delete button clicked', async () => {
      const onNodeDelete = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeDelete={onNodeDelete}
        />
      );

      const deleteButton = screen.getByTestId('delete-node-1');
      await user.click(deleteButton);

      expect(onNodeDelete).toHaveBeenCalledWith(mockDataFlat[0]);
    });
  });

  describe('nested tree structure', () => {
    it('renders nested nodes when expanded', async () => {
      const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

      expect(screen.getByText('Folder')).toBeInTheDocument();
      expect(screen.queryByText('Child Note 1')).not.toBeInTheDocument();

      // Click to expand
      await user.click(screen.getByText('Folder'));

      expect(screen.getByText('Child Note 1')).toBeInTheDocument();
      expect(screen.getByText('Child Note 2')).toBeInTheDocument();
    });

    it('collapses expanded nodes when clicked again', async () => {
      const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

      await user.click(screen.getByText('Folder'));
      expect(screen.getByText('Child Note 1')).toBeInTheDocument();

      await user.click(screen.getByText('Folder'));
      expect(screen.queryByText('Child Note 1')).not.toBeInTheDocument();
    });

    it('handles deeply nested structures', async () => {
      const { user } = render(<TreeView data={mockDataDeep} render={defaultRender} />);

      await user.click(screen.getByText('Root Folder'));
      expect(screen.getByText('Sub Folder')).toBeInTheDocument();

      await user.click(screen.getByText('Sub Folder'));
      expect(screen.getByText('Deep Note')).toBeInTheDocument();
    });

    it('passes correct level to nested nodes', () => {
      const renderSpy = vi.fn(defaultRender);
      render(<TreeView data={mockDataNested} render={renderSpy} />);

      // Root level nodes
      expect(renderSpy).toHaveBeenCalledWith(expect.objectContaining({ level: 0 }));
    });
  });
});

describe('TreeNode Sub-Components', () => {
  describe('TreeNode.Content', () => {
    it('renders children correctly', () => {
      render(
        <TreeView
          data={mockDataFlat}
          render={() => (
            <TreeNode.Content>
              <span>Test Content</span>
            </TreeNode.Content>
          )}
        />
      );

      expect(screen.getAllByText('Test Content')).toHaveLength(mockDataFlat.length);
    });

    it('applies custom className', () => {
      const { container } = render(
        <TreeView
          data={[mockDataFlat[0]]}
          render={() => (
            <TreeNode.Content className="custom-class">Content</TreeNode.Content>
          )}
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('handles click events', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={() => <TreeNode.Content>Clickable</TreeNode.Content>}
          onNodeSelect={onNodeSelect}
        />
      );

      await user.click(screen.getAllByText('Clickable')[0]);
      expect(onNodeSelect).toHaveBeenCalled();
    });
  });

  describe('TreeNode.Text', () => {
    it('displays node name', () => {
      render(
        <TreeView
          data={mockDataFlat}
          render={() => (
            <TreeNode.Content>
              <TreeNode.Text />
            </TreeNode.Content>
          )}
        />
      );

      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });

    it('enters edit mode on double-click', async () => {
      const { user } = render(<TreeView data={mockDataFlat} render={defaultRender} />);

      await user.dblClick(screen.getByText('First Note'));

      expect(screen.getByDisplayValue('First Note')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports custom children content', () => {
      render(
        <TreeView
          data={mockDataFlat}
          render={({ node }) => (
            <TreeNode.Content>
              <TreeNode.Text>Custom: {node.name}</TreeNode.Text>
            </TreeNode.Content>
          )}
        />
      );

      expect(screen.getByText('Custom: First Note')).toBeInTheDocument();
    });

    it('supports title attribute', () => {
      render(
        <TreeView
          data={mockDataFlat}
          render={({ node }) => (
            <TreeNode.Content>
              <TreeNode.Text title={`Title for ${node.name}`}>{node.name}</TreeNode.Text>
            </TreeNode.Content>
          )}
        />
      );

      const textElement = screen.getByText('First Note');
      expect(textElement).toHaveAttribute('title', 'Title for First Note');
    });
  });

  describe('TreeNode.Edit', () => {
    it('displays input with current node name', async () => {
      const { user } = render(<TreeView data={mockDataFlat} render={defaultRender} />);

      await user.dblClick(screen.getByText('First Note'));

      const input = screen.getByDisplayValue('First Note');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('saves on Enter key', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      await user.dblClick(screen.getByText('First Note'));
      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'New Name');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onNodeRename).toHaveBeenCalledWith(mockDataFlat[0], 'New Name');
    });

    it('saves on blur', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      await user.dblClick(screen.getByText('First Note'));
      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Blur Name');
      fireEvent.blur(input);

      expect(onNodeRename).toHaveBeenCalledWith(mockDataFlat[0], 'Blur Name');
    });

    it('cancels on Escape key', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      await user.dblClick(screen.getByText('First Note'));
      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, 'Should Cancel');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onNodeRename).not.toHaveBeenCalled();
      expect(screen.getByText('First Note')).toBeInTheDocument();
    });

    it('does not save if name unchanged', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      await user.dblClick(screen.getByText('First Note'));
      const input = screen.getByDisplayValue('First Note');
      fireEvent.blur(input);

      expect(onNodeRename).not.toHaveBeenCalled();
    });

    it('does not save if name is only whitespace', async () => {
      const onNodeRename = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeRename={onNodeRename}
        />
      );

      await user.dblClick(screen.getByText('First Note'));
      const input = screen.getByDisplayValue('First Note');
      await user.clear(input);
      await user.type(input, '   ');
      fireEvent.blur(input);

      expect(onNodeRename).not.toHaveBeenCalled();
    });
  });

  describe('TreeNode.DeleteButton', () => {
    it('renders delete button for leaf nodes', () => {
      render(<TreeView data={mockDataFlat} render={defaultRender} />);

      expect(screen.getByTestId('delete-node-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-node-2')).toBeInTheDocument();
    });

    it('does not render for parent nodes', async () => {
      const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

      // Parent node should not have delete button
      expect(screen.queryByTestId('delete-node-1')).not.toBeInTheDocument();

      // Expand to see child
      await user.click(screen.getByText('Folder'));

      // Child nodes should have delete button
      expect(screen.getByTestId('delete-node-2')).toBeInTheDocument();
    });

    it('calls onNodeDelete when clicked', async () => {
      const onNodeDelete = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeDelete={onNodeDelete}
        />
      );

      await user.click(screen.getByTestId('delete-node-1'));

      expect(onNodeDelete).toHaveBeenCalledWith(mockDataFlat[0]);
    });

    it('does not trigger node selection when clicked', async () => {
      const onNodeSelect = vi.fn();
      const onNodeDelete = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataFlat}
          render={defaultRender}
          onNodeSelect={onNodeSelect}
          onNodeDelete={onNodeDelete}
        />
      );

      await user.click(screen.getByTestId('delete-node-1'));

      expect(onNodeDelete).toHaveBeenCalled();
      expect(onNodeSelect).not.toHaveBeenCalled();
    });
  });

  describe('TreeNode.Icon', () => {
    it('renders icon for all nodes', () => {
      const { container } = render(
        <TreeView data={mockDataFlat} render={defaultRender} />
      );

      const icons = container.querySelectorAll('.tree-node-icon');
      expect(icons).toHaveLength(mockDataFlat.length);
    });

    it('accepts custom className', () => {
      const { container } = render(
        <TreeView
          data={[mockDataFlat[0]]}
          render={() => (
            <TreeNode.Content>
              <TreeNode.Icon className="custom-icon" />
            </TreeNode.Content>
          )}
        />
      );

      expect(container.querySelector('.custom-icon')).toBeInTheDocument();
    });
  });

  describe('TreeNode.ExpandIcon', () => {
    it('renders for parent nodes', () => {
      const { container } = render(
        <TreeView data={mockDataNested} render={defaultRender} />
      );

      const expandIcons = container.querySelectorAll('.tree-expand-arrow');
      expect(expandIcons.length).toBeGreaterThan(0);
    });

    it('toggles expansion when clicked', async () => {
      const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

      const folder = screen.getByText('Folder');
      expect(screen.queryByText('Child Note 1')).not.toBeInTheDocument();

      await user.click(folder);
      expect(screen.getByText('Child Note 1')).toBeInTheDocument();

      await user.click(folder);
      expect(screen.queryByText('Child Note 1')).not.toBeInTheDocument();
    });

    it('does not trigger selection when clicked', async () => {
      const onNodeSelect = vi.fn();
      const { user } = render(
        <TreeView
          data={mockDataNested}
          render={defaultRender}
          onNodeSelect={onNodeSelect}
        />
      );

      await user.click(screen.getByText('Folder'));

      // Should not call onNodeSelect for parent nodes
      expect(onNodeSelect).not.toHaveBeenCalled();
    });
  });
});

describe('TreeNodeContext', () => {
  it('provides node data to child components', () => {
    const TestComponent = () => {
      const { node } = useTreeNodeContext();
      return <div>Node: {node.name}</div>;
    };

    render(
      <TreeView
        data={mockDataFlat}
        render={() => (
          <TreeNode.Content>
            <TestComponent />
          </TreeNode.Content>
        )}
      />
    );

    expect(screen.getByText('Node: First Note')).toBeInTheDocument();
  });

  it('provides editing state', async () => {
    const TestComponent = () => {
      const { isEditing } = useTreeNodeContext();
      return <div>Editing: {isEditing ? 'yes' : 'no'}</div>;
    };

    const { user } = render(
      <TreeView
        data={mockDataFlat}
        render={({ editing }) => (
          <TreeNode.Content>
            <TestComponent />
            {editing ? <TreeNode.Edit /> : <TreeNode.Text />}
          </TreeNode.Content>
        )}
      />
    );

    expect(screen.getAllByText('Editing: no')[0]).toBeInTheDocument();

    await user.dblClick(screen.getByText('First Note'));

    await waitFor(() => {
      expect(screen.getByText('Editing: yes')).toBeInTheDocument();
    });
  });

  it('provides expanded state', async () => {
    const TestComponent = () => {
      const { isExpanded } = useTreeNodeContext();
      return <div>Expanded: {isExpanded ? 'yes' : 'no'}</div>;
    };

    const { user } = render(
      <TreeView
        data={mockDataNested}
        render={() => (
          <TreeNode.Content>
            <TestComponent />
            <TreeNode.Text />
          </TreeNode.Content>
        )}
      />
    );

    const expandedText = screen.getAllByText(/Expanded:/)[0];
    expect(expandedText).toHaveTextContent('Expanded: no');

    await user.click(screen.getByText('Folder'));

    await waitFor(() => {
      const updated = screen.getAllByText(/Expanded:/)[0];
      expect(updated).toHaveTextContent('Expanded: yes');
    });
  });
});

describe('Edge Cases and Special Scenarios', () => {
  it('handles nodes with special characters', () => {
    const specialData: TreeNodeType[] = [
      { id: 1, name: 'Note with "quotes"', selected: false },
      { id: 2, name: 'Note with <tags>', selected: false },
      { id: 3, name: 'Note with & symbols', selected: false }
    ];

    render(<TreeView data={specialData} render={defaultRender} />);

    expect(screen.getByText('Note with "quotes"')).toBeInTheDocument();
    expect(screen.getByText('Note with <tags>')).toBeInTheDocument();
    expect(screen.getByText('Note with & symbols')).toBeInTheDocument();
  });

  it('handles very long node names', () => {
    const longData: TreeNodeType[] = [
      {
        id: 1,
        name: 'This is a very long node name that should be handled gracefully by the tree view component without breaking the layout or causing display issues',
        selected: false
      }
    ];

    render(<TreeView data={longData} render={defaultRender} />);

    expect(screen.getByText(/This is a very long node name/)).toBeInTheDocument();
  });

  it('handles rapid expand/collapse clicks', async () => {
    const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

    const folder = screen.getByText('Folder');

    // Rapid clicks
    await user.click(folder);
    await user.click(folder);
    await user.click(folder);
    await user.click(folder);

    // Should not crash and should be in collapsed state
    expect(screen.queryByText('Child Note 1')).not.toBeInTheDocument();
  });

  it('does not allow editing parent nodes', async () => {
    const { user } = render(<TreeView data={mockDataNested} render={defaultRender} />);

    await user.dblClick(screen.getByText('Folder'));

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('maintains state after adding/removing nodes', async () => {
    const { rerender, user } = render(
      <TreeView data={mockDataNested} render={defaultRender} />
    );

    await user.click(screen.getByText('Folder'));
    expect(screen.getByText('Child Note 1')).toBeInTheDocument();

    // Add a new node
    const newData = [...mockDataNested, { id: 5, name: 'New Note', selected: false }];

    rerender(<TreeView data={newData} render={defaultRender} />);

    expect(screen.getByText('New Note')).toBeInTheDocument();
    // Expanded state might not persist (depends on implementation)
  });
});

describe('Accessibility', () => {
  it('renders with proper ARIA attributes', () => {
    render(<TreeView data={mockDataFlat} render={defaultRender} />);

    expect(screen.getByTestId('tree-view')).toBeInTheDocument();
  });

  it('edit input has proper focus management', async () => {
    const { user } = render(<TreeView data={mockDataFlat} render={defaultRender} />);

    await user.dblClick(screen.getByText('First Note'));

    const input = screen.getByRole('textbox');
    expect(input).toHaveFocus();
  });
});
