/**
 * Client-side layout wrapper for main application structure.
 * Arranges navigation, sidebar, content panels, and footer using CSS grid layout.
 *
 * @remarks
 * Dependencies: `./notes/MainNotesLayout.module.css` for CSS Module grid layout styles,
 * and `./Footer` for application footer component.
 *
 * **Layout Structure:**
 * ```
 * ┌─────────────────────────┐
 * │      navigation         │  (Top nav bar)
 * ├──────────┬──────────────┤
 * │          │              │
 * │ sidebar  │   content    │  (Main panels)
 * │          │              │
 * └──────────┴──────────────┘
 * │       children          │  (Optional additional content)
 * └─────────────────────────┘
 * │        Footer           │  (Copyright info)
 * └─────────────────────────┘
 * ```
 *
 * **Usage:**
 * - Used in `src/app/layout.tsx` as the root layout wrapper
 * - Receives slots from Next.js parallel routes (@navigation, @sidebar, @content)
 * - Flexible: all props are optional
 *
 * **CSS Grid:**
 * - Uses CSS Modules for scoped styling
 * - Responsive grid layout defined in `MainNotesLayout.module.css`
 * - Sidebar and content panels are arranged horizontally
 *
 * @example
 * ```tsx
 * import AppLayoutClient from '@/components/AppLayoutClient';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <AppLayoutClient
 *       navigation={<TopNavigationBar />}
 *       sidebar={<LeftPanel />}
 *       content={<MainContent />}
 *     >
 *       {children}
 *     </AppLayoutClient>
 *   );
 * }
 * ```
 *
 * @public
 */
'use client';

import styles from './notes/MainNotesLayout.module.css';
import Footer from './Footer';

/**
 * Props for AppLayoutClient component.
 *
 * @internal
 */
interface AppLayoutClientProps {
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
  content?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Application layout wrapper with navigation, sidebar, content, and footer.
 *
 * @param props - Layout slot contents
 * @param props.navigation - Top navigation bar (from @navigation slot)
 * @param props.sidebar - Left sidebar panel (from @sidebar slot)
 * @param props.content - Main content area (from @content slot)
 * @param props.children - Additional content below main panels
 * @returns Rendered layout structure
 *
 * @remarks
 * This component is the main layout container for the application. It receives
 * content from Next.js parallel routes and arranges them in a CSS grid layout.
 *
 * **Slots:**
 * - `navigation`: Top navigation bar (user menu, title)
 * - `sidebar`: Left panel (notes tree, create button)
 * - `content`: Main content area (note editor)
 * - `children`: Additional content (modals, dialogs)
 *
 * **Styling:**
 * - Uses CSS Modules for scoped styling (`MainNotesLayout.module.css`)
 * - Grid layout with flexible sidebar and content panels
 * - Footer always pinned to bottom
 *
 * @example
 * ```tsx
 * <AppLayoutClient
 *   navigation={<TopNavigationBar />}
 *   sidebar={<LeftPanel />}
 *   content={<NoteEditor />}
 * />
 * ```
 *
 * @public
 */
export default function AppLayoutClient({
  navigation,
  sidebar,
  content,
  children
}: AppLayoutClientProps) {
  return (
    <div className={styles.layout}>
      {navigation}
      <div className={styles.panels}>
        {sidebar}
        {content}
      </div>
      {children}
      <Footer />
    </div>
  );
}
