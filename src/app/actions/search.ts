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
 * - Database-agnostic: MySQL full-text search (prod) or SQLite LIKE (test)
 * - Returns paginated results (3 results per page)
 * - Each occurrence of search term generates a separate result
 * - Generates content snippets around each match (80 chars)
 * - Returns line number for each specific match
 * - Counts total matches per note for context
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
 * Finds all matches of the search query in content with their line numbers and snippets.
 *
 * @param {string} content - Full note content
 * @param {string} query - Search query
 * @returns {Array<{lineNumber: number, snippet: string}>} Array of all matches with context
 *
 * @example
 * ```tsx
 * const matches = findAllMatches('Line 1 react\nLine 2\nLine 3 react hooks', 'react');
 * // Returns: [
 * //   { lineNumber: 1, snippet: 'Line 1 react...' },
 * //   { lineNumber: 3, snippet: 'Line 3 react hooks' }
 * // ]
 * ```
 *
 * @remarks
 * - Case-insensitive matching
 * - Line numbers are 1-based
 * - Generates 80-char snippets around each match
 * - Returns empty array if no matches found
 */
function findAllMatches(
  content: string,
  query: string
): Array<{ lineNumber: number; snippet: string }> {
  // Guard against empty query
  if (!query.trim()) {
    return [];
  }

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matches: Array<{ lineNumber: number; snippet: string }> = [];
  let pos = 0;

  while ((pos = lowerContent.indexOf(lowerQuery, pos)) !== -1) {
    // Calculate line number for this match
    const beforeMatch = content.substring(0, pos);
    const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

    // Generate snippet around this match
    const contextBefore = 50;
    const contextAfter = 50;
    const start = Math.max(0, pos - contextBefore);
    const end = Math.min(content.length, pos + query.length + contextAfter);

    let snippet = content.substring(start, end);

    // Add ellipsis if truncated
    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < content.length) {
      snippet = snippet + '...';
    }

    // Ensure snippet doesn't exceed 80 characters
    if (snippet.length > SNIPPET_SIZE) {
      snippet = snippet.substring(0, SNIPPET_SIZE) + '...';
    }

    matches.push({ lineNumber, snippet });

    // Move position forward to find next match
    pos += lowerQuery.length;
  }

  return matches;
}

/**
 * Searches notes for the authenticated user with full-text search.
 * Returns paginated results with snippets and match information.
 * Each occurrence of the search term generates a separate result.
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
 * - Database-agnostic: MySQL MATCH AGAINST (prod) or SQLite LIKE (test)
 * - Returns 3 results per page (one per match occurrence)
 * - Notes with multiple matches appear multiple times in results
 * - MySQL: Notes ordered by relevance score
 * - SQLite: Notes ordered by noteId (newest first)
 * - Generates 80-char snippets around each match
 * - Each result includes line number of that specific match
 * - Counts total matches per note
 * - Only searches user's own notes
 * - SQLite searches both name and content fields
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

    // Detect database provider: CI environment uses SQLite, otherwise MySQL
    const isSQLite = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

    // Fetch ALL matching notes (no pagination at DB level)
    // We'll paginate the expanded results after processing
    let searchResults: Array<{
      noteId: number;
      name: string;
      content: string;
    }>;

    if (isSQLite) {
      // SQLite: Use LIKE for simple pattern matching
      const searchPattern = `%${query}%`;

      searchResults = await prisma.$queryRaw<
        Array<{
          noteId: number;
          name: string;
          content: string;
        }>
      >`
        SELECT noteId, name, content
        FROM note
        WHERE userId = ${userId}
          AND (content LIKE ${searchPattern} OR name LIKE ${searchPattern})
        ORDER BY noteId DESC
      `;
    } else {
      // MySQL: Use full-text search with MATCH AGAINST
      searchResults = await prisma.$queryRaw<
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
      `;
    }

    // Expand each note into multiple results (one per match)
    const allMatches: Array<{
      noteId: number;
      noteName: string;
      contentSnippet: string;
      lineNumber: number;
      totalMatches: number;
    }> = [];

    for (const note of searchResults) {
      const matches = findAllMatches(note.content || '', query);
      const totalMatches = matches.length;

      // If no matches in content but note was returned (matched in name),
      // create a single result with line 1
      if (matches.length === 0) {
        allMatches.push({
          noteId: note.noteId,
          noteName: note.name,
          contentSnippet: generateSnippet(note.content || '', query),
          lineNumber: 1,
          totalMatches: 0 // No matches in content, matched in name only
        });
      } else {
        // Create a result entry for each match
        for (const match of matches) {
          allMatches.push({
            noteId: note.noteId,
            noteName: note.name,
            contentSnippet: match.snippet,
            lineNumber: match.lineNumber,
            totalMatches
          });
        }
      }
    }

    // Total results is the count of all match occurrences
    const totalMatchesCount = allMatches.length;

    // Apply pagination to the expanded results
    const skip = (page - 1) * RESULTS_PER_PAGE;
    const paginatedResults = allMatches.slice(skip, skip + RESULTS_PER_PAGE);
    const totalPages = Math.ceil(totalMatchesCount / RESULTS_PER_PAGE);

    return {
      results: paginatedResults,
      totalResults: totalMatchesCount,
      currentPage: page,
      totalPages
    };
  } catch (error) {
    // Re-throw specific errors (auth, validation) without wrapping
    if (error instanceof Error) {
      if (
        error.message === 'Unauthorized' ||
        error.message === 'Search query is required'
      ) {
        throw error;
      }
    }

    // Log and wrap unexpected errors
    console.error('Error searching notes:', error);
    throw new Error('Failed to search notes');
  }
}
