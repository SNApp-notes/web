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
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { useColorMode } from '@/components/ui/color-mode';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorProps, EditorRef } from '@/types/editor';

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
    const viewRef = useRef<EditorView | null>(null);
    const [contentLoaded, setContentLoaded] = useState(false);

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

    const scrollToLine = useCallback(
      (line: number) => {
        if (!viewRef.current) {
          return;
        }

        const doc = viewRef.current.state.doc;
        // Check if the requested line exists in the document
        if (line > doc.lines || line < 1) {
          console.warn(`Cannot scroll to line ${line}: document has ${doc.lines} lines`);
          return;
        }

        try {
          const { from: position } = doc.line(line);
          viewRef.current.dispatch({
            selection: { anchor: position, head: position },
            scrollIntoView: true
          });
          viewRef.current.focus();
        } catch (error) {
          console.warn(`Cannot scroll to line ${line}:`, error);
        }
      },
      [viewRef]
    );

    const handleEditorMount = useCallback(
      (view: EditorView) => {
        viewRef.current = view;

        const editorRef: EditorRef = {
          focus: () => view?.focus(),
          blur: () => view?.contentDOM?.blur(),
          getValue: () => view?.state?.doc?.toString() || '',
          setValue: (newValue: string) => {
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
      },
      [onEditorReady, scrollToLine, ref]
    );

    // Track when content is loaded (not just changed due to editing)
    useEffect(() => {
      if (value && !contentLoaded) {
        setContentLoaded(true);
      }
    }, [value, contentLoaded]);

    // Handle line scrolling when selectedLine changes or content is loaded
    useEffect(() => {
      if (selectedLine && viewRef.current && contentLoaded) {
        scrollToLine(selectedLine);
      }
    }, [selectedLine, contentLoaded, scrollToLine]);

    return (
      <CodeMirror
        value={value}
        height="100%"
        placeholder={placeholder}
        editable={!readOnly}
        onChange={onChange}
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
        onCreateEditor={handleEditorMount}
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
