/**
 * @module actions/search
 * @description Server action for full-text search operations.
 * Provides search functionality with pagination, snippet generation, and match counting.
 * All operations are scoped to the authenticated user.
 *
 * @dependencies
 * - @/lib/auth: Server-side authentication for user session
 * - @/lib/prisma: Database client with Note type
 * - next/headers: Server-side header access
 *
 * @remarks
 * - All functions require active user session
 * - Uses MySQL full-text search with @@fulltext index
 * - Returns paginated results (5 results per page)
 * - Generates content snippets around first match (150 chars)
 * - Counts total matches per note for "X more matches" indicator
 * - Case-insensitive search with partial matching
 *
 * @example
 * ```tsx
 * import { searchNotes } from '@/app/actions/search';
 *
 * // Search for notes containing "react"
 * const results = await searchNotes('react', 1);
 * console.log(`Found ${results.totalResults} results`);
 * ```
 */

'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import type { SearchResponse } from '@/components/search/SearchContext';

const RESULTS_PER_PAGE = 3;
const SNIPPET_SIZE = 80;

/**
 * Generates a content snippet around the first match of the search query.
 * Limits snippet to 150 characters with ellipsis.
 *
 * @param {string} content - Full note content
 * @param {string} query - Search query
 * @returns {string} Content snippet with match context
 *
 * @example
 * ```tsx
 * const snippet = generateSnippet('This is a test content with react hooks', 'react');
 * // Returns: "...test content with react hooks"
 * ```
 *
 * @remarks
 * - Case-insensitive matching
 * - Shows 50 characters before and after match
 * - Truncates to 150 characters total
 * - Adds ellipsis for truncated content
 * - Returns first 150 chars if no match found
 */
function generateSnippet(content: string, query: string): string {
  // Guard against empty query
  if (!query.trim()) {
    return (
      content.substring(0, SNIPPET_SIZE) + (content.length > SNIPPET_SIZE ? '...' : '')
    );
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    // No match found, return first 150 characters
    return (
      content.substring(0, SNIPPET_SIZE) + (content.length > SNIPPET_SIZE ? '...' : '')
    );
  }

  // Extract context around match (50 chars before and after)
  const contextBefore = 50;
  const contextAfter = 50;
  const start = Math.max(0, matchIndex - contextBefore);
  const end = Math.min(content.length, matchIndex + query.length + contextAfter);

  let snippet = content.substring(start, end);

  // Add ellipsis if truncated
  if (start > 0) {
    snippet = '...' + snippet;
  }
  if (end < content.length) {
    snippet = snippet + '...';
  }

  // Ensure snippet doesn't exceed 150 characters
  if (snippet.length > SNIPPET_SIZE) {
    snippet = snippet.substring(0, SNIPPET_SIZE) + '...';
  }

  return snippet;
}

/**
 * Finds the line number of the first match in the content.
 *
 * @param {string} content - Full note content
 * @param {string} query - Search query
 * @returns {number} Line number (1-based) of first match, or 1 if no match
 *
 * @example
 * ```tsx
 * const lineNumber = findLineNumber('Line 1\nLine 2 with react\nLine 3', 'react');
 * // Returns: 2
 * ```
 *
 * @remarks
 * - Case-insensitive matching
 * - Line numbers are 1-based (first line is 1)
 * - Returns 1 if no match found
 */
function findLineNumber(content: string, query: string): number {
  // Guard against empty query
  if (!query.trim()) {
    return 1;
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return 1;
  }

  // Count newlines before match to determine line number
  const beforeMatch = content.substring(0, matchIndex);
  const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

  return lineNumber;
}

/**
 * Counts total occurrences of search query in content.
 *
 * @param {string} content - Full note content
 * @param {string} query - Search query
 * @returns {number} Total number of matches
 *
 * @example
 * ```tsx
 * const count = countMatches('React is great. I love React!', 'react');
 * // Returns: 2
 * ```
 *
 * @remarks
 * - Case-insensitive matching
 * - Counts overlapping matches
 */
function countMatches(content: string, query: string): number {
  // Guard against empty query to prevent infinite loop
  if (!query.trim()) {
    return 0;
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let count = 0;
  let pos = 0;

  while ((pos = lowerContent.indexOf(lowerQuery, pos)) !== -1) {
    count++;
    pos += lowerQuery.length;
  }

  return count;
}

/**
 * Searches notes for the authenticated user with full-text search.
 * Returns paginated results with snippets and match information.
 *
 * @async
 * @param {string} query - Search query
 * @param {number} [page=1] - Page number (1-based)
 * @returns {Promise<SearchResponse>} Paginated search results
 *
 * @throws {Error} 'Unauthorized' if no active session
 * @throws {Error} 'Search query is required' if query is empty
 * @throws {Error} 'Failed to search notes' for database errors
 *
 * @example
 * ```tsx
 * // Search first page
 * const results = await searchNotes('react hooks', 1);
 *
 * // Navigate to second page
 * const page2 = await searchNotes('react hooks', 2);
 * ```
 *
 * @remarks
 * - Requires active user session
 * - Uses MySQL full-text search with MATCH AGAINST
 * - Returns 5 results per page
 * - Results ordered by relevance (match score)
 * - Generates 150-char snippets with match context
 * - Includes line number of first match
 * - Counts total matches per note
 * - Only searches user's own notes
 */
export async function searchNotes(
  query: string,
  page: number = 1
): Promise<SearchResponse> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList
    });

    if (!session?.user?.id) {
      throw new Error('Unauthorized');
    }

    if (!query.trim()) {
      throw new Error('Search query is required');
    }

    const userId = session.user.id;
    const skip = (page - 1) * RESULTS_PER_PAGE;

    // MySQL full-text search with MATCH AGAINST
    // Note: Prisma doesn't have native support for MATCH AGAINST, so we use raw query
    const searchResults = await prisma.$queryRaw<
      Array<{
        noteId: number;
        name: string;
        content: string;
      }>
    >`
      SELECT noteId, name, content
      FROM note
      WHERE userId = ${userId}
        AND MATCH(content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
      ORDER BY MATCH(content) AGAINST(${query} IN NATURAL LANGUAGE MODE) DESC
      LIMIT ${RESULTS_PER_PAGE}
      OFFSET ${skip}
    `;

    // Count total results
    const totalResultsQuery = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM note
      WHERE userId = ${userId}
        AND MATCH(content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
    `;

    const totalResults = Number(totalResultsQuery[0]?.count || 0);
    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

    // Process results to generate snippets and match info
    const results = searchResults.map((note) => ({
      noteId: note.noteId,
      noteName: note.name,
      contentSnippet: generateSnippet(note.content || '', query),
      lineNumber: findLineNumber(note.content || '', query),
      totalMatches: countMatches(note.content || '', query)
    }));

    return {
      results,
      totalResults,
      currentPage: page,
      totalPages
    };
  } catch (error) {
    console.error('Error searching notes:', error);
    throw new Error('Failed to search notes');
  }
}
