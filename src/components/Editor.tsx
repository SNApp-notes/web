'use client';

import { forwardRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { basicLight, basicDark } from '@uiw/codemirror-theme-basic';
import { Box } from '@chakra-ui/react';
import type { EditorProps } from '@/types/editor';

const Editor = forwardRef<HTMLDivElement, EditorProps>(
  (
    {
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
      ...props
    },
    ref
  ) => {
    const extensions = [
      markdown({
        base: markdownLanguage,
        codeLanguages: languages
      })
    ];

    const themeExtension = theme === 'dark' ? basicDark : basicLight;

    return (
      <Box ref={ref} className={className} width={width} {...props}>
        <CodeMirror
          value={value}
          height={height}
          placeholder={placeholder}
          editable={!readOnly}
          onChange={onChange}
          extensions={extensions}
          basicSetup={basicSetup}
          theme={themeExtension}
        />
      </Box>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
