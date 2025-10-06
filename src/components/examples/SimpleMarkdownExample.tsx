'use client';

import { useState } from 'react';
import { Box, Heading, VStack } from '@chakra-ui/react';
import MarkdownEditor from '@/components/MarkdownEditor';

const simpleExample = `# Simple Usage Example

Here's how to use the MarkdownEditor component:

\`\`\`jsx
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
\`\`\`

## Features
- ✅ Markdown syntax highlighting
- ✅ Code block highlighting
- ✅ Line numbers
- ✅ Auto-completion
- ✅ Bracket matching
- ✅ Folding support
`;

export default function SimpleMarkdownExample() {
  const [content, setContent] = useState(simpleExample);

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack gap={4} alignItems="stretch">
        <Heading size="md">Simple Markdown Editor</Heading>

        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Start typing your markdown here..."
          height="500px"
        />
      </VStack>
    </Box>
  );
}
