# Simple Usage Example

Here's how to use the Editor component:

```jsx
import Editor from '@/components/Editor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <Editor
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
