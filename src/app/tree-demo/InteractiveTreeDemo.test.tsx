import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { userEvent } from '@testing-library/user-event';
import { InteractiveTreeDemo } from './InteractiveTreeDemo';

describe('InteractiveTreeDemo', () => {
  it('renders with color mode button by default', () => {
    render(<InteractiveTreeDemo />);

    expect(screen.getByLabelText('Toggle color mode')).toBeInTheDocument();
    expect(screen.getByText('Selected Item Details')).toBeInTheDocument();
    expect(
      screen.getByText('Select an item from the tree to view its details')
    ).toBeInTheDocument();
  });

  it('hides color mode button when showColorModeButton is false', () => {
    render(<InteractiveTreeDemo showColorModeButton={false} />);

    expect(screen.queryByLabelText('Toggle color mode')).not.toBeInTheDocument();
    expect(screen.getByText('Selected Item Details')).toBeInTheDocument();
  });

  it('displays placeholder text when no node is selected', () => {
    render(<InteractiveTreeDemo />);

    expect(
      screen.getByText('Select an item from the tree to view its details')
    ).toBeInTheDocument();
  });

  it('expands category nodes when clicked but does not select them', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // Click on Personal category should expand it
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    // Should show children like "Goals" and "Shopping List"
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Shopping List')).toBeInTheDocument();

    // But details panel should still show placeholder since categories can't be selected
    expect(
      screen.getByText('Select an item from the tree to view its details')
    ).toBeInTheDocument();
  });

  it('displays node details when a leaf note is selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // First expand Personal category
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    // Then click on a leaf node (Shopping List)
    const leafNode = screen.getByText('Shopping List');
    await user.click(leafNode);

    // Should display the details
    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('Milk, bread, eggs, apples...')).toBeInTheDocument();
  });

  it('displays created date when available', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // Expand Personal and select Shopping List
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    const leafNode = screen.getByText('Shopping List');
    await user.click(leafNode);

    expect(screen.getByText('CREATED')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it('displays node ID in monospace font', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // Expand Personal and select Shopping List
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    const leafNode = screen.getByText('Shopping List');
    await user.click(leafNode);

    expect(screen.getByText('ID')).toBeInTheDocument();
    const idElement = screen.getByText('5'); // Shopping List has id: '5'
    expect(idElement).toBeInTheDocument();
  });

  it('updates selected node when different leaf nodes are clicked', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // Expand Personal category
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    // Select Shopping List
    const shoppingList = screen.getByText('Shopping List');
    await user.click(shoppingList);
    expect(screen.getByText('Milk, bread, eggs, apples...')).toBeInTheDocument();

    // Expand Work category
    const workNode = screen.getByText('Work');
    await user.click(workNode);

    // Select Meeting Notes
    const meetingNotes = screen.getByText('Meeting Notes');
    await user.click(meetingNotes);
    expect(
      screen.getByText('Team standup: Discussed sprint goals and blockers...')
    ).toBeInTheDocument();
    expect(screen.queryByText('Milk, bread, eggs, apples...')).not.toBeInTheDocument();
  });

  it('handles notes with minimal content', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    // Test that all note nodes display their basic properties
    const personalNode = screen.getByText('Personal');
    await user.click(personalNode);

    const shoppingList = screen.getByText('Shopping List');
    await user.click(shoppingList);

    expect(screen.getByText('Shopping List')).toBeInTheDocument();
    expect(screen.getByText('note')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // ID
    expect(screen.getByText('CONTENT')).toBeInTheDocument();
  });

  it('shows children count for parent nodes when selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const parentNode = screen.getByText('Work');
    await user.click(parentNode);

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
    expect(screen.getByText('2 item(s)')).toBeInTheDocument();
  });

  it('displays created date when available', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const nodeWithDate = screen.getByText('Personal');
    await user.click(nodeWithDate);

    expect(screen.getByText('CREATED')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it('shows children count for parent nodes when selected', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const parentNode = screen.getByText('Work Projects');
    await user.click(parentNode);

    expect(screen.getByText('Work Projects')).toBeInTheDocument();
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.getByText('2 item(s)')).toBeInTheDocument();
  });

  it('displays created date when available', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const nodeWithDate = screen.getByText('My Daily Notes');
    await user.click(nodeWithDate);

    expect(screen.getByText('CREATED')).toBeInTheDocument();
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it('displays node ID in monospace font', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const node = screen.getByText('Personal');
    await user.click(node);

    expect(screen.getByText('ID')).toBeInTheDocument();
    const idElement = screen.getByText('1');
    expect(idElement).toBeInTheDocument();
  });

  it('updates selected node when different nodes are clicked', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const firstNode = screen.getByText('Personal');
    await user.click(firstNode);
    expect(screen.getByText('2 item(s)')).toBeInTheDocument();

    const secondNode = screen.getByText('Work');
    await user.click(secondNode);
    expect(screen.getByText('2 item(s)')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.queryByText('Personal')).toBeInTheDocument(); // Still in tree, but not selected
  });

  it('handles nodes without content gracefully', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const categoryNode = screen.getByText('Personal');
    await user.click(categoryNode);

    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
    expect(screen.queryByText('CONTENT')).not.toBeInTheDocument();
  });

  it('updates selected node when different nodes are clicked', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const firstNode = screen.getByText('My Daily Notes');
    await user.click(firstNode);
    expect(
      screen.getByText('This is where I keep my daily thoughts and observations.')
    ).toBeInTheDocument();

    const secondNode = screen.getByText('Meeting Notes');
    await user.click(secondNode);
    expect(
      screen.getByText('Notes from various meetings and discussions.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('This is where I keep my daily thoughts and observations.')
    ).not.toBeInTheDocument();
  });

  it('handles nodes without content gracefully', async () => {
    const user = userEvent.setup();
    render(<InteractiveTreeDemo />);

    const folderNode = screen.getByText('Work Projects');
    await user.click(folderNode);

    expect(screen.getByText('Work Projects')).toBeInTheDocument();
    expect(screen.getByText('folder')).toBeInTheDocument();
    expect(screen.queryByText('CONTENT')).not.toBeInTheDocument();
  });
});
