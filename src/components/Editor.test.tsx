import { render, screen } from '@/test/utils';
import { vi, describe, it, expect } from 'vitest';
import Editor from './Editor';

describe('Editor', () => {
  it('renders with default props', () => {
    render(<Editor />);

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
  });

  it('displays initial value', () => {
    const initialValue = '# Hello World';
    render(<Editor value={initialValue} />);

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor.textContent).toContain('Hello World');
  });

  it('shows placeholder when empty', () => {
    const placeholder = 'Start typing...';
    render(<Editor placeholder={placeholder} />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('aria-placeholder', placeholder);
  });

  it('calls onChange when provided', () => {
    const handleChange = vi.fn();

    render(<Editor onChange={handleChange} />);

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
  });

  it('respects readOnly prop', () => {
    render(<Editor readOnly />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('contenteditable', 'false');
  });

  it('applies custom height to wrapper', () => {
    const customHeight = '300px';
    const { container } = render(<Editor height={customHeight} />);

    const editorWrapper = container.querySelector('.cm-editor');
    expect(editorWrapper).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Editor ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });

  it('renders with markdown language support', () => {
    render(<Editor value="# Test" />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveAttribute('data-language', 'markdown');
  });
});
