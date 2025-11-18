/**
 * External link component with consistent styling and external link icon.
 *
 * @remarks
 * This module wraps Chakra UI's Link component with consistent styling for external links.
 * It automatically applies blue color palette, underline variant, and adds an external link icon.
 *
 * **Features:**
 * - Consistent blue underlined styling for all external links
 * - Automatic external link icon (LuExternalLink from react-icons)
 * - Forwards all standard link props (href, target, rel, etc.)
 *
 * **Styling:**
 * - Uses Chakra UI v3 Link component with `colorPalette="blue"` and `variant="underline"`
 * - Icon positioned inline with link text
 *
 * @example
 * ```tsx
 * import Link from '@/components/Link';
 *
 * function Footer() {
 *   return (
 *     <Link href="https://github.com/example/repo">
 *       View on GitHub
 *     </Link>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With additional props
 * <Link href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
 *   Documentation
 * </Link>
 * ```
 *
 * @public
 */
import { Link } from '@chakra-ui/react';
import { ReactNode } from 'react';
import { LuExternalLink } from 'react-icons/lu';

/**
 * Props for the Link component.
 *
 * @interface LinkProps
 * @property {string} href - Target URL for the link
 * @property {ReactNode} children - Link text or content
 *
 * @public
 */
interface LinkProps {
  href: string;
  children: ReactNode;
}

/**
 * External link component with blue underlined styling and external link icon.
 *
 * @param props - Link configuration
 * @param props.href - Target URL for the link
 * @param props.children - Link text or content to display
 * @returns Rendered Chakra UI Link with external link icon
 *
 * @remarks
 * **Styling:**
 * - `colorPalette="blue"` - Blue color scheme from theme
 * - `variant="underline"` - Underlined text decoration
 * - External link icon (LuExternalLink) automatically appended
 *
 * **Accessibility:**
 * - Standard link accessibility (keyboard navigation, focus styles)
 * - Visual indicator (icon) for external links
 * - Should include `target="_blank"` and `rel="noopener noreferrer"` for security
 *
 * @example
 * ```tsx
 * <Link href="https://example.com">Visit Website</Link>
 * ```
 *
 * @public
 */
export default function ({ children, ...props }: LinkProps) {
  return (
    <Link {...props} colorPalette="blue" variant="underline">
      {children}
      <LuExternalLink />
    </Link>
  );
}
