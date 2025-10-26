export interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: string;
  width?: string;
  readOnly?: boolean;
  selectedLine?: number;

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
  onEditorReady?: (editorRef: EditorRef) => void;
  onSave?: () => void;
}

export interface EditorRef {
  focus: () => void;
  blur: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  scrollToLine: (line: number) => void;
}
