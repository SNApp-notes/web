'use client';

import { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { Box } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { EditorView } from '@codemirror/view';
import type { EditorProps, EditorRef } from '@/types/editor';

const Editor = memo(function Editor({
  value = '',
  onChange,
  placeholder,
  height = '400px',
  width = '100%',
  readOnly = false,
  selectedLine,
  basicSetup = {
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
  },
  className,
  onEditorReady,
  ...props
}: EditorProps) {
  const viewRef = useRef<EditorView | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  const { colorMode } = useColorMode();
  const themeExtension = useMemo(
    () => (colorMode === 'dark' ? basicDark : basicLight),
    [colorMode]
  );

  // Create a theme for full height when height is 100%
  const fullHeightTheme = useMemo(
    () =>
      height === '100%'
        ? EditorView.theme({
            '&': {
              height: '100%',
              maxHeight: '100%'
            },
            '.cm-scroller': {
              overflow: 'auto',
              maxHeight: '100%'
            },
            '.cm-focused': {
              outline: 'none'
            },
            '.cm-content': {
              minHeight: '100%'
            },
            '.cm-editor': {
              height: '100%'
            }
          })
        : [],
    [height]
  );

  const extensions = useMemo(
    () => [
      markdown({
        base: markdownLanguage,
        codeLanguages: languages
      }),
      ...(Array.isArray(fullHeightTheme) ? fullHeightTheme : [fullHeightTheme])
    ],
    [fullHeightTheme]
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

      if (onEditorReady) {
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

        onEditorReady(editorRef);
      }
    },
    [onEditorReady, scrollToLine]
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
    <Box
      className={className}
      width={width}
      height={height === '100%' ? '100%' : 'auto'}
      display="flex"
      flexDirection="column"
      {...props}
    >
      <CodeMirror
        value={value}
        height={height}
        placeholder={placeholder}
        editable={!readOnly}
        onChange={onChange}
        extensions={extensions}
        basicSetup={basicSetup}
        theme={themeExtension}
        onCreateEditor={handleEditorMount}
        style={
          height === '100%'
            ? {
                height: '100%',
                flex: 1
              }
            : undefined
        }
      />
    </Box>
  );
});

export default Editor;
