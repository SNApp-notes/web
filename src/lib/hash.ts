/**
 * @module lib/hash
 * @description Utility functions for content hashing.
 * Used for detecting when content has been restored to saved state (e.g., via CTRL+Z).
 *
 * @dependencies
 * - crypto: Node.js built-in module for hashing
 *
 * @remarks
 * - Uses SHA-1 hash algorithm (sufficient for checksums, not security)
 * - Handles null content gracefully
 * - Consistent hashing for reliable comparison
 *
 * @example
 * ```ts
 * const hash1 = hashContent('Hello world');
 * const hash2 = hashContent('Hello world');
 * console.log(hash1 === hash2); // true
 *
 * const hash3 = hashContent('Different content');
 * console.log(hash1 === hash3); // false
 * ```
 */

import { createHash } from 'crypto';

/**
 * Computes SHA-1 hash of content string.
 * Used to detect when editor content matches last saved state.
 *
 * @param {string | null} content - Content to hash (null treated as empty string)
 * @returns {string} Hexadecimal SHA-1 hash string
 *
 * @example
 * ```ts
 * const hash = hashContent('# My Note\n\nContent here');
 * // Returns: 'a3b2c1d4e5f6...' (40 character hex string)
 * ```
 */
export function hashContent(content: string | null): string {
  const normalizedContent = content ?? '';
  return createHash('sha1').update(normalizedContent, 'utf8').digest('hex');
}
