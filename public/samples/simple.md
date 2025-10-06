# Simple Usage Example

Here's how to use the MarkdownEditor component:

```jsx
import MarkdownEditor from '@/components/MarkdownEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <MarkdownEditor
      value={content}
      onChange={setContent}
      placeholder="Start typing..."
      height="400px"
    />
  );
}
```

## Features

- ✅ Markdown syntax highlighting
- ✅ Code block highlighting
- ✅ Line numbers
- ✅ Auto-completion
- ✅ Bracket matching
- ✅ Folding support
