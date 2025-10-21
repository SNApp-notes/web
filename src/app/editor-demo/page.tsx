'use client';

import { useState } from 'react';
import { Box, Container, Text, Stack } from '@chakra-ui/react';
import Editor from '@/components/Editor';

const longSampleContent = `# Editor Scrolling Demo

This is a demo page to test the CodeMirror editor scrolling functionality.

## Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Section 1
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsection 1.1
Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

### Subsection 1.2
Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Section 2
Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

### Code Example
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 20; i++) {
  console.log('F(' + i + ') = ' + fibonacci(i));
}
\`\`\`

## Section 3
Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

### More Content
At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.

## Section 4
Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.

### Another Code Block
\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
sorted_numbers = quicksort(numbers)
print("Original:", numbers)
print("Sorted:", sorted_numbers)
\`\`\`

## Section 5
Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.

### Final Thoughts
This content should be long enough to require scrolling. If you can see scrollbars and can scroll with the mouse wheel, then the editor scrolling is working correctly!

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Section 6
More content here to make sure we have enough text to scroll. This section adds even more content to ensure that the editor definitely needs to scroll vertically.

### Subsection 6.1
Even more text here. We want to make absolutely certain that this content exceeds the 500px height limit we set on the container.

### Subsection 6.2
And yet more content. Keep adding text until scrolling is definitely required.

## Section 7
Final section with more content. This should definitely cause scrolling now.

### The End
If you can see this text, scrolling to the bottom worked! The scrollbars should be visible and mouse wheel scrolling should work.
`;

export default function EditorDemoPage() {
  const [content, setContent] = useState(longSampleContent);

  return (
    <Container maxW="container.xl" py={8}>
      <Stack gap={6} align="stretch">
        <Box>
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            CodeMirror Editor Scrolling Demo
          </Text>
          <Text color="gray.600">
            This page tests the editor scrolling functionality in isolation. The editor
            below should show scrollbars when content exceeds the visible area.
          </Text>
        </Box>

        <Box
          border="1px solid"
          borderColor="gray.300"
          borderRadius="md"
          overflow="hidden"
          height="500px"
        >
          <Editor value={content} onChange={setContent} placeholder="Start typing..." />
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Editor height: 500px (fixed) | Content lines: {content.split('\n').length}
          </Text>
        </Box>
      </Stack>
    </Container>
  );
}
