/** The customer site's top-level tabs. */
export type NavTab = 'home' | 'venues' | 'popular';

export const NAV_TABS: { id: NavTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'venues', label: 'Venues' },
  { id: 'popular', label: 'Popular' },
];

/** Home-page URL for a tab, so tabs can be linked to from other pages. */
export function navTabHref(tab: NavTab): string {
  return tab === 'home' ? '/' : `/?tab=${tab}`;
}
