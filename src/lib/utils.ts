import type { NoteTreeNode } from '@/types/tree';

export function selectNode(nodes: NoteTreeNode[], selectedId: number | null) {
  if (selectedId === null) {
    return nodes;
  }
  return nodes.map((node) => {
    // If this is the old selected node, deselect it
    if (node.selected && node.id !== selectedId) {
      return { ...node, selected: false };
    }
    // If this is the new selected node, select it
    if (node.id === selectedId && !node.selected) {
      return { ...node, selected: true };
    }
    // Otherwise return the same node reference
    return node;
  });
}
