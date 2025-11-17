import LeftPanel from './LeftPanel';
import { getSettings } from '@/app/actions/settings';
import { SortKey, SortOrder } from '@/types/notes';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function SidebarPage() {
  // Fetch user settings for initial sort preferences
  let sortBy = SortKey.CreationTime;
  let sortOrder = SortOrder.Ascending;

  // Check if user is authenticated before fetching settings
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session?.user) {
    try {
      const settings = await getSettings();
      sortBy = settings.sortBy as SortKey;
      sortOrder = settings.sortOrder as SortOrder;
    } catch (error) {
      // Settings fetch failed - use defaults
      // Silent error: user will get default sort order
    }
  }

  return <LeftPanel initialSortKey={sortBy} initialSortOrder={sortOrder} />;
}
