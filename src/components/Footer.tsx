/**
 * Application footer with copyright information and license details.
 * Displays current year, author information, and AGPL-3.0-or-later license.
 *
 * @remarks
 * Dependencies: `@chakra-ui/react` for Box and Text components used in layout and typography.
 *
 * **Features:**
 * - Dynamic copyright year (automatically updates)
 * - Author information with link to personal website
 * - License information (AGPL-3.0-or-later)
 * - Consistent styling with border and muted colors
 *
 * **Styling:**
 * - Sticky footer at bottom of page
 * - Subtle background with border separator
 * - Small font size for unobtrusive display
 * - Centered text alignment
 *
 * **Accessibility:**
 * - Semantic `<footer>` element
 * - Link to author's website
 * - High contrast for readability
 *
 * @example
 * ```tsx
 * import Footer from '@/components/Footer';
 *
 * export default function AppLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <div>
 *       <main>{children}</main>
 *       <Footer />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
'use client';

import { Box, Text } from '@chakra-ui/react';

/**
 * Application footer with copyright and license information.
 *
 * @returns Rendered footer with copyright text
 *
 * @remarks
 * **Display:**
 * - Copyright year dynamically generated from current date
 * - Format: "Copyright (C) YYYY Author Name <email> | License"
 * - Link to author's personal website (https://jakub.jankiewicz.org/)
 *
 * **Styling:**
 * - Subtle background (`bg.subtle`)
 * - Top border for visual separation
 * - Small font size (xs)
 * - Muted text color
 * - Minimal padding (1px vertical, 4px horizontal)
 * - Centered text
 *
 * **License:**
 * - AGPL-3.0-or-later (GNU Affero General Public License v3.0 or later)
 * - Suitable for open-source web applications
 *
 * @example
 * ```tsx
 * // Output: "Copyright (C) 2025 Jakub T. Jankiewicz <jcubic@onet.pl> | AGPL-3.0-or-later"
 * <Footer />
 * ```
 *
 * @public
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="bg.subtle"
      borderTop="1px solid"
      borderColor="border"
      py={1}
      px={4}
      flexShrink={0}
      height="auto"
    >
      <Text fontSize="xs" color="fg.muted" textAlign="center">
        Copyright (C) {currentYear}{' '}
        <a href="https://jakub.jankiewicz.org/">Jakub T. Jankiewicz</a>{' '}
        &lt;jcubic@onet.pl&gt; | AGPL-3.0-or-later
      </Text>
    </Box>
  );
}
