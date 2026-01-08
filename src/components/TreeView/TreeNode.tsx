'use client';

import { memo, useEffect } from 'react';
import { VStack } from '@chakra-ui/react';
import { useParams } from 'next/navigation';
import type { TreeNode as TreeNodeType } from '@/types/tree';
import { TreeNodeProvider, useTreeNodeContext } from './TreeNodeContext';
import type { TreeNodeRenderProps } from './types';
import { TreeNodeEdit } from './TreeNodeEdit';
import { TreeNodeText } from './TreeNodeText';
import { TreeNodeDeleteButton } from './TreeNodeDeleteButton';
import { TreeNodeContent } from './TreeNodeContent';
import { TreeNodeIcon } from './TreeNodeIcon';
import { TreeNodeExpandIcon } from './TreeNodeExpandIcon';

interface TreeNodeInternalProps<T = unknown> {
  node: TreeNodeType<T>;
  level?: number;
  render?: (props: TreeNodeRenderProps<T>) => React.ReactNode;
  onNodeSelect?: (node: TreeNodeType<T>) => void;
  onNodeRename?: (node: TreeNodeType<T>, newName: string) => void;
  onNodeDelete?: (node: TreeNodeType<T>) => void;
}

function TreeNodeComponent<T = unknown>({ level = 0, render }: TreeNodeInternalProps<T>) {
  const {
    nodeRef,
    node: contextNode,
    isExpanded,
    isEditing,
    handleDoubleClick
  } = useTreeNodeContext<T>();
  const params = useParams();
  const urlNoteId = params?.id ? parseInt(params.id as string, 10) : null;

  const hasChildren = Boolean(contextNode.children && contextNode.children.length > 0);
  const selected = contextNode.selected;

  useEffect(() => {
    const shouldScrollIntoView = urlNoteId !== null && contextNode.id === urlNoteId;

    if (shouldScrollIntoView && nodeRef?.current?.scrollIntoView) {
      nodeRef.current.scrollIntoView({
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [nodeRef, contextNode.id, urlNoteId]);

  const renderProps: TreeNodeRenderProps<T> = {
    node: contextNode,
    selected,
    editing: isEditing,
    hasChildren,
    isExpanded,
    level,
    startEditing: handleDoubleClick
  };

  const renderedContent = render ? render(renderProps) : null;

  return (
    <VStack align="stretch" gap={0} ref={nodeRef} scrollMargin="6px">
      {renderedContent}

      {hasChildren && isExpanded && (
        <VStack align="stretch" gap={0}>
          {contextNode.children?.map((child) => (
            <MemoizedTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              render={render}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

const MemoizedTreeNodeComponent = memo(TreeNodeComponent) as <T = unknown>(
  props: Omit<TreeNodeInternalProps<T>, 'onNodeSelect' | 'onNodeRename' | 'onNodeDelete'>
) => React.ReactElement;

// Internal component that wraps with provider and passes handlers
export function TreeNodeInternal<T = unknown>(props: TreeNodeInternalProps<T>) {
  return (
    <TreeNodeProvider
      node={props.node}
      level={props.level || 0}
      onNodeSelect={props.onNodeSelect}
      onNodeRename={props.onNodeRename}
      onNodeDelete={props.onNodeDelete}
    >
      <MemoizedTreeNodeComponent {...props} />
    </TreeNodeProvider>
  );
}

// Memoized version for child nodes that inherit handlers from parent context
function MemoizedTreeNode<T = unknown>(
  props: Omit<TreeNodeInternalProps<T>, 'onNodeSelect' | 'onNodeRename' | 'onNodeDelete'>
) {
  const parentContext = useTreeNodeContext<T>();

  return (
    <TreeNodeProvider
      node={props.node}
      level={props.level || 0}
      onNodeSelect={parentContext.onNodeSelect}
      onNodeRename={parentContext.onNodeRename}
      onNodeDelete={parentContext.onNodeDelete}
    >
      <MemoizedTreeNodeComponent {...props} />
    </TreeNodeProvider>
  );
}

// Export TreeNode namespace with sub-components
export const TreeNode = Object.assign(TreeNodeInternal, {
  Edit: TreeNodeEdit,
  Text: TreeNodeText,
  DeleteButton: TreeNodeDeleteButton,
  Content: TreeNodeContent,
  Icon: TreeNodeIcon,
  ExpandIcon: TreeNodeExpandIcon
});
