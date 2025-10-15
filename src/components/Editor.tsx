'use client';

import { useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { Box } from '@chakra-ui/react';
import type { EditorView } from 'codemirror';
import type { EditorProps, EditorRef } from '@/types/editor';

export default function Editor({
  value = '',
  onChange,
  placeholder,
  height = '400px',
  width = '100%',
  readOnly = false,
  theme = 'light',
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

  const extensions = [
    markdown({
      base: markdownLanguage,
      codeLanguages: languages
    })
  ];

  const themeExtension = theme === 'dark' ? basicDark : basicLight;

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
          scrollToLine: (line: number) => {
            if (view) {
              const linePos = view.state.doc.line(line).from;
              view.dispatch({
                selection: { anchor: linePos },
                scrollIntoView: true
              });
              view.focus();
            }
          }
        };

        onEditorReady(editorRef);
      }
    },
    [onEditorReady]
  );

  return (
    <Box className={className} width={width} {...props}>
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
      />
    </Box>
  );
}
