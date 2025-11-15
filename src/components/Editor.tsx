/**
 * CodeMirror 6-based markdown editor component with syntax highlighting,
 * line scrolling, keyboard shortcuts, and theme support.
 *
 * @remarks
 * This module uses CodeMirror 6 (`@uiw/react-codemirror`) with markdown language support
 * (`@codemirror/lang-markdown`), nested code block syntax highlighting (`@codemirror/language-data`),
 * theme support (`@uiw/codemirror-theme-basic`), and Chakra UI color mode integration.
 *
 * **Features:**
 * - Markdown syntax highlighting with nested code block support
 * - Line numbers, bracket matching, auto-completion, code folding
 * - Automatic theme switching based on Chakra UI color mode
 * - Line scrolling via `selectedLine` prop or `scrollToLine()` method
 * - Keyboard shortcut: Cmd/Ctrl+S triggers `onSave` callback
 * - Auto-focus on mount, read-only mode support
 * - Exposes imperative API via `EditorRef` (focus, blur, getValue, setValue, scrollToLine)
 *
 * **Performance:**
 * - Memoized to prevent unnecessary re-renders
 * - Uses `useMemo` for extensions and theme to avoid recreation
 * - Large content samples loaded via `fetch()` (not bundled)
 *
 * **Accessibility:**
 * - Auto-focus for keyboard navigation
 * - Read-only mode for viewing content
 * - Scrollable content with keyboard support
 *
 * @example
 * ```tsx
 * import Editor from '@/components/Editor';
 *
 * function NoteEditor() {
 *   const [content, setContent] = useState('# Hello World');
 *   const editorRef = useRef<EditorRef>(null);
 *
 *   const handleSave = () => {
 *     const currentContent = editorRef.current?.getValue();
 *     console.log('Saving:', currentContent);
 *   };
 *
 *   const scrollToLine10 = () => {
 *     editorRef.current?.scrollToLine(10);
 *   };
 *
 *   return (
 *     <Editor
 *       ref={editorRef}
 *       value={content}
 *       onChange={setContent}
 *       placeholder="Start typing..."
 *       selectedLine={5}
 *       onSave={handleSave}
 *       onEditorReady={(editor) => console.log('Editor ready!', editor)}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Read-only editor for viewing content
 * <Editor
 *   value={noteContent}
 *   readOnly={true}
 *   selectedLine={lineNumber}
 * />
 * ```
 *
 * @public
 */
'use client';

import {
  useRef,
  useCallback,
  useEffect,
  useState,
  memo,
  useMemo,
  forwardRef
} from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { useColorMode } from '@/components/ui/color-mode';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorProps, EditorRef } from '@/types/editor';

/**
 * CodeMirror 6-based markdown editor with syntax highlighting and line scrolling.
 *
 * @param props - Editor configuration
 * @param props.value - Current editor content (default: '')
 * @param props.onChange - Callback when content changes
 * @param props.placeholder - Placeholder text when editor is empty
 * @param props.readOnly - Whether editor is read-only (default: false)
 * @param props.selectedLine - Line number to scroll to (1-based)
 * @param props.className - Additional CSS classes
 * @param props.onEditorReady - Callback when editor API is ready
 * @param props.onSave - Callback for Cmd/Ctrl+S keyboard shortcut
 * @param ref - Ref exposing editor API methods
 * @returns Rendered CodeMirror editor
 *
 * @remarks
 * **Line Scrolling:**
 * - Set `selectedLine` prop to scroll to a specific line (1-based index)
 * - Use `editorRef.current.scrollToLine(lineNumber)` for programmatic scrolling
 * - Scrolling waits for content to load and view to be ready
 * - Invalid line numbers are logged as warnings (no errors thrown)
 *
 * **Editor Ref API:**
 * - `focus()` - Focus the editor
 * - `blur()` - Blur the editor
 * - `getValue()` - Get current content as string
 * - `setValue(value)` - Replace all content
 * - `scrollToLine(line)` - Scroll to line number (1-based)
 *
 * **Theme:**
 * - Automatically switches between light/dark based on Chakra UI color mode
 * - Uses `basicLight` and `basicDark` themes from `@uiw/codemirror-theme-basic`
 *
 * **Keyboard Shortcuts:**
 * - Cmd/Ctrl+S: Triggers `onSave` callback (prevents default browser save)
 *
 * **Performance:**
 * - Memoized component to prevent unnecessary re-renders
 * - Extensions and theme are memoized to avoid recreation
 * - Uses `requestAnimationFrame` for smooth scrolling
 *
 * @example
 * ```tsx
 * const editorRef = useRef<EditorRef>(null);
 *
 * // Scroll to line 42
 * editorRef.current?.scrollToLine(42);
 *
 * // Get current content
 * const content = editorRef.current?.getValue();
 *
 * // Set new content
 * editorRef.current?.setValue('# New Content');
 * ```
 *
 * @public
 */
const Editor = memo(
  forwardRef<EditorRef, EditorProps>(function Editor(
    {
      value = '',
      onChange,
      placeholder,
      readOnly = false,
      selectedLine,
      className,
      onEditorReady,
      onSave
    },
    ref
  ) {
    const codeMirrorRef = useRef<ReactCodeMirrorRef>(null);
    const [contentLoaded, setContentLoaded] = useState(false);
    const [viewReady, setViewReady] = useState(false);

    const { colorMode } = useColorMode();
    const themeExtension = useMemo(
      () => (colorMode === 'dark' ? basicDark : basicLight),
      [colorMode]
    );

    // Create a theme for proper scrolling and height handling
    const editorTheme = useMemo(
      () =>
        EditorView.theme({
          '&': {
            height: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
          },
          '&.cm-focused': {
            outline: 'none'
          },
          '.cm-scroller': {
            fontSize: '16px',
            fontFamily: 'monospace',
            overflow: 'auto !important',
            maxHeight: '100%'
          },
          '.cm-content': {
            padding: '8px',
            minHeight: '100%'
          },
          '.cm-editor': {
            height: '100%',
            overflow: 'hidden'
          }
        }),
      []
    );

    const extensions = useMemo(
      () => [
        markdown({
          base: markdownLanguage,
          extensions: {
            remove: ['SetextHeading']
          },
          codeLanguages: languages
        }),
        EditorView.lineWrapping,
        editorTheme,
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              if (onSave) {
                onSave();
                return true;
              }
              return false;
            }
          }
        ])
      ],
      [editorTheme, onSave]
    );

    const scrollToLine = useCallback((line: number) => {
      const view = codeMirrorRef.current?.view;
      if (!view) {
        return;
      }

      const doc = view.state.doc;
      // Check if the requested line exists in the document
      if (line > doc.lines || line < 1) {
        console.warn(`Cannot scroll to line ${line}: document has ${doc.lines} lines`);
        return;
      }

      try {
        const { from: position } = doc.line(line);
        view.focus();
        const scrollPosition = position > 0 ? position - 1 : position;
        view.dispatch({
          selection: { anchor: position, head: position },
          effects: [EditorView.scrollIntoView(scrollPosition, { y: 'start' })]
        });
      } catch (error) {
        console.warn(`Cannot scroll to line ${line}:`, error);
      }
    }, []);

    // This callback is called when the editor view is created
    // We use it to signal that the ref is now populated
    const handleCreateEditor = useCallback(() => {
      setViewReady(true);
    }, []);

    // Expose EditorRef to parent component when view becomes available
    useEffect(() => {
      if (!viewReady) {
        return;
      }

      const editorRef: EditorRef = {
        focus: () => codeMirrorRef.current?.view?.focus(),
        blur: () => codeMirrorRef.current?.view?.contentDOM?.blur(),
        getValue: () => codeMirrorRef.current?.view?.state?.doc?.toString() || '',
        setValue: (newValue: string) => {
          const view = codeMirrorRef.current?.view;
          if (view) {
            view.dispatch({
              changes: {
                from: 0,
                to: view.state.doc.length,
                insert: newValue
              }
            });
          }
        },
        scrollToLine
      };

      // Forward ref to parent
      if (ref) {
        if (typeof ref === 'function') {
          ref(editorRef);
        } else {
          ref.current = editorRef;
        }
      }

      if (onEditorReady) {
        onEditorReady(editorRef);
      }
    }, [viewReady, onEditorReady, scrollToLine, ref]);

    // Track when content is loaded (not just changed due to editing)
    useEffect(() => {
      if (value && !contentLoaded) {
        setContentLoaded(true);
      }
    }, [value, contentLoaded]);

    // Handle line scrolling when selectedLine changes or content is loaded
    useEffect(() => {
      const view = codeMirrorRef.current?.view;
      // Ensure view is ready, content is loaded, and we have a line to scroll to
      if (selectedLine && view && contentLoaded && viewReady) {
        // Use requestAnimationFrame to ensure DOM is fully rendered
        requestAnimationFrame(() => {
          scrollToLine(selectedLine);
        });
      }
    }, [selectedLine, contentLoaded, viewReady, scrollToLine]);

    return (
      <CodeMirror
        ref={codeMirrorRef}
        value={value}
        height="100%"
        placeholder={placeholder}
        editable={!readOnly}
        onChange={onChange}
        autoFocus={true}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
          foldGutter: true,
          dropCursor: false,
          allowMultipleSelections: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true
        }}
        theme={themeExtension}
        onCreateEditor={handleCreateEditor}
        className={className}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    );
  })
);

export default Editor;
