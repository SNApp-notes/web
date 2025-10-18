import ContentSlotDefault from '../../default';

export default function InterceptedNotePage() {
  // Since we moved all note display logic to the default content slot
  // that responds to context events, we just use the same component here.
  // This ensures consistent behavior whether accessed via direct URL
  // or context-based selection.
  return <ContentSlotDefault />;
}
