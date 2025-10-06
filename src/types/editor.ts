export interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string;
  width?: string;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
  basicSetup?: {
    lineNumbers?: boolean;
    highlightActiveLine?: boolean;
    highlightSelectionMatches?: boolean;
    searchKeymap?: boolean;
    foldGutter?: boolean;
    dropCursor?: boolean;
    allowMultipleSelections?: boolean;
    bracketMatching?: boolean;
    closeBrackets?: boolean;
    autocompletion?: boolean;
    rectangularSelection?: boolean;
    crosshairCursor?: boolean;
    highlightActiveLineGutter?: boolean;
    indentOnInput?: boolean;
    tabSize?: number;
  };
  className?: string;
}

export interface EditorRef {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}
