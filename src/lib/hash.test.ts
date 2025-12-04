/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { hashContent } from './hash';

describe('hashContent', () => {
  it('should return consistent hash for same content', () => {
    const content = 'Hello world';
    const hash1 = hashContent(content);
    const hash2 = hashContent(content);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(40); // SHA-1 produces 40 character hex string
  });

  it('should return different hashes for different content', () => {
    const content1 = 'Hello world';
    const content2 = 'Goodbye world';

    const hash1 = hashContent(content1);
    const hash2 = hashContent(content2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle null content', () => {
    const hash = hashContent(null);
    expect(hash).toBe(hashContent('')); // null should be treated as empty string
    expect(hash).toHaveLength(40);
  });

  it('should handle empty string', () => {
    const hash = hashContent('');
    expect(hash).toHaveLength(40);
    expect(hash).toBeTruthy();
  });

  it('should handle markdown content with newlines', () => {
    const content = '# Title\n\nParagraph\n\n- Item 1\n- Item 2';
    const hash = hashContent(content);
    expect(hash).toHaveLength(40);
  });

  it('should produce different hashes for content with different whitespace', () => {
    const content1 = 'Hello world';
    const content2 = 'Hello  world'; // double space

    const hash1 = hashContent(content1);
    const hash2 = hashContent(content2);

    expect(hash1).not.toBe(hash2);
  });
});
