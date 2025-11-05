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
        view.dispatch({
          selection: { anchor: position, head: position },
          scrollIntoView: true
        });
        view.focus();
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
      if (selectedLine && view && contentLoaded) {
        scrollToLine(selectedLine);
      }
    }, [selectedLine, contentLoaded, scrollToLine]);

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
