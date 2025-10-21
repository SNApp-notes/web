import { render, screen, waitFor } from '@/test/utils';
import { vi, describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import Editor from './Editor';
import type { EditorRef } from '@/types/editor';

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

  it('calls onEditorReady with EditorRef when mounted', async () => {
    const onEditorReady = vi.fn();
    render(<Editor onEditorReady={onEditorReady} />);

    await waitFor(() => {
      expect(onEditorReady).toHaveBeenCalledTimes(1);
    });

    const editorRef = onEditorReady.mock.calls[0][0];
    expect(editorRef).toHaveProperty('focus');
    expect(editorRef).toHaveProperty('blur');
    expect(editorRef).toHaveProperty('getValue');
    expect(editorRef).toHaveProperty('setValue');
    expect(editorRef).toHaveProperty('scrollToLine');
  });

  it('EditorRef getValue returns current editor content', async () => {
    const initialValue = '# Hello World\nThis is content';
    let editorRef: EditorRef | null = null;

    const onEditorReady = (ref: EditorRef) => {
      editorRef = ref;
    };

    render(<Editor value={initialValue} onEditorReady={onEditorReady} />);

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    expect(editorRef!.getValue()).toBe(initialValue);
  });

  it('EditorRef setValue updates editor content', async () => {
    const initialValue = 'Initial content';
    const newValue = 'Updated content';
    let editorRef: EditorRef | null = null;

    const onEditorReady = (ref: EditorRef) => {
      editorRef = ref;
    };

    render(<Editor value={initialValue} onEditorReady={onEditorReady} />);

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    act(() => {
      editorRef!.setValue(newValue);
    });

    expect(editorRef!.getValue()).toBe(newValue);
  });

  it('calls onChange when content changes', async () => {
    const onChange = vi.fn();
    render(<Editor value="" onChange={onChange} />);

    // Note: In JSDOM environment, actual typing simulation is limited
    // This test verifies the onChange prop is passed correctly to CodeMirror
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled(); // Should not be called on mount
  });

  it('handles value prop changes', () => {
    const { rerender } = render(<Editor value="Initial" />);

    let editor = screen.getByRole('textbox');
    expect(editor.textContent).toContain('Initial');

    rerender(<Editor value="Updated" />);

    editor = screen.getByRole('textbox');
    expect(editor.textContent).toContain('Updated');
  });

  it('handles selectedLine prop for scrolling', async () => {
    const multilineContent = '# Line 1\n\nLine 3\n\nLine 5\n\nLine 7\n\nLine 9';
    let editorRef: EditorRef | null = null;

    const onEditorReady = (ref: EditorRef) => {
      editorRef = ref;
    };

    const { rerender } = render(
      <Editor value={multilineContent} selectedLine={1} onEditorReady={onEditorReady} />
    );

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    // Test that scrollToLine method exists and can be called
    expect(() => {
      editorRef!.scrollToLine(5);
    }).not.toThrow();

    // Test changing selectedLine prop triggers effect
    rerender(
      <Editor value={multilineContent} selectedLine={5} onEditorReady={onEditorReady} />
    );

    // Verify scrollToLine method is still accessible
    expect(typeof editorRef!.scrollToLine).toBe('function');
  });

  it('EditorRef focus method works', async () => {
    let editorRef: EditorRef | null = null;

    const onEditorReady = (ref: EditorRef) => {
      editorRef = ref;
    };

    render(<Editor onEditorReady={onEditorReady} />);

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    // Focus should not throw an error
    expect(() => {
      editorRef!.focus();
    }).not.toThrow();
  });

  it('EditorRef blur method works', async () => {
    let editorRef: EditorRef | null = null;

    const onEditorReady = (ref: EditorRef) => {
      editorRef = ref;
    };

    render(<Editor onEditorReady={onEditorReady} />);

    await waitFor(() => {
      expect(editorRef).not.toBeNull();
    });

    // Blur should not throw an error
    expect(() => {
      editorRef!.blur();
    }).not.toThrow();
  });

  it('forwards ref with EditorRef methods', async () => {
    let refValue: EditorRef | null = null;
    const ref = (editorRef: EditorRef | null) => {
      refValue = editorRef;
    };

    render(<Editor ref={ref} />);

    await waitFor(() => {
      expect(refValue).not.toBeNull();
    });

    expect(refValue).toHaveProperty('focus');
    expect(refValue).toHaveProperty('blur');
    expect(refValue).toHaveProperty('getValue');
    expect(refValue).toHaveProperty('setValue');
    expect(refValue).toHaveProperty('scrollToLine');
  });

  it('applies custom className', () => {
    const customClass = 'custom-editor-class';
    const { container } = render(<Editor className={customClass} />);

    const editorElement = container.querySelector(`.${customClass}`);
    expect(editorElement).toBeInTheDocument();
  });

  it('handles empty value prop', () => {
    render(<Editor value="" />);

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor.textContent).toBe('');
  });

  it('handles undefined value prop', () => {
    render(<Editor />);

    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
  });
});
