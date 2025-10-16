'use client';

import { useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { Box } from '@chakra-ui/react';
import { useColorMode } from '@/components/ui/color-mode';
import { EditorView } from '@codemirror/view';
import type { EditorProps, EditorRef } from '@/types/editor';

export default function Editor({
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

  const { colorMode } = useColorMode();
  const themeExtension = colorMode === 'dark' ? basicDark : basicLight;

  // Create a theme for full height when height is 100%
  const fullHeightTheme =
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
      : [];

  const extensions = [
    markdown({
      base: markdownLanguage,
      codeLanguages: languages
    }),
    ...(Array.isArray(fullHeightTheme) ? fullHeightTheme : [fullHeightTheme])
  ];

  const scrollToLine = useCallback(
    (line: number) => {
      if (!viewRef.current) {
        return;
      }
      const { from: position } = viewRef.current.state.doc.line(line);
      try {
        viewRef.current.dispatch({
          selection: { anchor: position, head: position },
          scrollIntoView: true
        });
        viewRef.current.focus();
      } catch (error) {
        console.warn(`Cannot scroll to line ${position}:`, error);
      }
    },
    [viewRef]
  );

  const handleEditorMount = useCallback(
    (view: EditorView) => {
      viewRef.current = view;

      // Scroll to selectedLine if provided on mount
      if (selectedLine) {
        scrollToLine(selectedLine);
      }

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
    [onEditorReady, scrollToLine, selectedLine]
  );

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
}
