/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DashboardTabId =
  | 'home'
  | 'cats'
  | 'menu'
  | 'orders'
  | 'stats'
  | 'appearance'
  | 'branches'
  | 'addons'
  | 'qr'
  | 'telegram'
  | 'set';

export type AdminTabId =
  | 'home'
  | 'ov'
  | 'partners'
  | 'notes'
  | 'reports'
  | 'staff'
  | 'home_editor'
  | 'settings'
  | 'account';

export type ParsedRoute =
  | { page: 'home'; scrollSection?: 'services' | 'steps' | 'demo' | 'pricing' | 'faq'; path: string }
  | { page: 'login'; path: '/login' }
  | { page: 'signup'; path: '/signup' }
  | { page: 'forgot'; path: '/forgot' }
  | { page: 'onboard'; path: '/onboard' }
  | { page: 'dashboard'; tab: DashboardTabId; branchId?: string; menuSlug?: string; isAppearanceShortcut?: boolean; path: string }
  | { page: 'admin'; tab: AdminTabId; path: string }
  | { page: 'menu'; restaurantId: string; isSlug?: boolean; path: string };

const DASHBOARD_SEGMENT_TO_TAB: Record<string, DashboardTabId> = {
  home: 'home',
  overview: 'home',
  stats: 'stats',
  analytics: 'stats',
  cats: 'cats',
  categories: 'cats',
  items: 'menu',
  menu: 'menu',
  orders: 'orders',
  appearance: 'appearance',
  lay: 'appearance',
  theme: 'appearance',
  branches: 'branches',
  qr: 'qr',
  addons: 'addons',
  telegram: 'telegram',
  settings: 'set',
  set: 'set',
};

const DASHBOARD_TAB_TO_SEGMENT: Record<DashboardTabId, string> = {
  home: 'home',
  cats: 'cats',
  menu: 'items',
  orders: 'orders',
  stats: 'stats',
  appearance: 'appearance',
  branches: 'branches',
  addons: 'addons',
  qr: 'qr',
  telegram: 'telegram',
  set: 'settings',
};

const ADMIN_TABS: AdminTabId[] = [
  'home',
  'ov',
  'partners',
  'notes',
  'reports',
  'staff',
  'home_editor',
  'settings',
  'account',
];

const RESERVED_TOP_SEGMENTS = new Set([
  'home',
  'services',
  'steps',
  'demo',
  'pricing',
  'faq',
  'login',
  'signup',
  'forgot',
  'onboard',
  'dashboard',
  'admin',
  'menu',
  'api',
  'assets',
]);

function resolveAdminTab(sub: string): AdminTabId {
  if (!sub) return 'home';
  if (sub === 'accounts') return 'partners';
  if (sub === 'home-editor' || sub === 'plans') return 'home_editor';
  return ADMIN_TABS.includes(sub as AdminTabId) ? (sub as AdminTabId) : 'home';
}

export function isDashboardPath(pathname?: string): boolean {
  const raw = String(pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')).trim();
  const clean = raw.split('?')[0].replace(/\/+$/, '') || '/';
  const segs = clean.split('/').filter(Boolean);
  if (segs[0]?.toLowerCase() === 'dashboard') return true;
  if (
    segs.length >= 2 &&
    segs[1].toLowerCase() === 'dashboard' &&
    !RESERVED_TOP_SEGMENTS.has(segs[0].toLowerCase())
  ) {
    return true;
  }
  return false;
}

export function extractDashboardSlugFromPath(pathname?: string): string | undefined {
  const raw = String(pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '')).trim();
  const clean = raw.split('?')[0].replace(/\/+$/, '') || '/';
  const segs = clean.split('/').filter(Boolean);
  if (
    segs.length >= 2 &&
    segs[1].toLowerCase() === 'dashboard' &&
    !RESERVED_TOP_SEGMENTS.has(segs[0].toLowerCase())
  ) {
    try {
      return decodeURIComponent(segs[0]).trim() || undefined;
    } catch {
      return segs[0].trim() || undefined;
    }
  }
  return undefined;
}

export function getDashboardTabPath(tab: DashboardTabId, branchId?: string, menuSlug?: string): string {
  const seg = DASHBOARD_TAB_TO_SEGMENT[tab] || 'home';
  const cleanSlug = String(menuSlug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
  if (cleanSlug && !cleanSlug.includes('/') && !RESERVED_TOP_SEGMENTS.has(cleanSlug)) {
    return `/${encodeURIComponent(cleanSlug)}/dashboard/${seg}`;
  }
  const cleanBranch = String(branchId || '').trim();
  if (cleanBranch) {
    return `/dashboard/b/${encodeURIComponent(cleanBranch)}/${seg}`;
  }
  return `/dashboard/${seg}`;
}

export function getAdminTabPath(tab: AdminTabId): string {
  return `/admin/${ADMIN_TABS.includes(tab) ? tab : 'home'}`;
}

export function getMenuPath(restaurantId: string): string {
  const clean = String(restaurantId || '').trim();
  if (!clean || clean === 'demo') return '/cap-burger';
  return `/${clean}`;
}

/**
 * Converts any route target (clean path or legacy hash string) into a canonical clean path.
 */
export function normalizeRouteTarget(target: string): string {
  const raw = String(target || '').trim();
  if (!raw || raw === '#' || raw === '/' || raw === '#home' || raw === 'home' || raw === '/home') {
    return '/';
  }

  // Strip leading # and leading /
  const stripped = raw.replace(/^#+/, '').replace(/^\/+/, '');
  const [pathOnly, queryPart] = stripped.split('?');
  const suffix = queryPart ? `?${queryPart}` : '';

  const segments = pathOnly.split('/').filter(Boolean);
  const root = segments[0] || '';
  const sub = segments[1] || '';

  if (root === 'home') return `/${suffix}`;
  if (root === 'demo' || root === 'menu-demo') return `/cap-burger${suffix}`;
  if (root === 'services' || root === 'steps' || root === 'pricing' || root === 'faq') {
    return `/${root}${suffix}`;
  }
  if (root === 'login' || root === 'signup' || root === 'forgot' || root === 'onboard') {
    return `/${root}${suffix}`;
  }

  // Menu-slug scoped dashboard route: /:slug/dashboard/:tab?
  if (
    segments.length >= 2 &&
    sub.toLowerCase() === 'dashboard' &&
    !RESERVED_TOP_SEGMENTS.has(root.toLowerCase())
  ) {
    let decodedSlug = root;
    try {
      decodedSlug = decodeURIComponent(root);
    } catch {
      // keep raw
    }
    const tabSeg = (segments[2] || 'home').toLowerCase();
    const mappedTab = DASHBOARD_SEGMENT_TO_TAB[tabSeg] || 'home';
    return `${getDashboardTabPath(mappedTab, undefined, decodedSlug)}${suffix}`;
  }

  if (root === 'dashboard') {
    if (sub === 'b' && segments[2]) {
      let decodedBranch = segments[2];
      try {
        decodedBranch = decodeURIComponent(segments[2]);
      } catch {
        // keep raw segment
      }
      const tabSeg = segments[3] || 'home';
      const mappedTab = DASHBOARD_SEGMENT_TO_TAB[tabSeg] || 'home';
      return `${getDashboardTabPath(mappedTab, decodedBranch)}${suffix}`;
    }
    const mappedTab = DASHBOARD_SEGMENT_TO_TAB[sub] || 'home';
    return `${getDashboardTabPath(mappedTab)}${suffix}`;
  }

  if (root === 'admin') {
    const mappedAdmin = resolveAdminTab(sub);
    return `${getAdminTabPath(mappedAdmin)}${suffix}`;
  }

  // Normalize /menu/:id and legacy /menu-:id to root slug paths (/:slug)
  if (root === 'menu' && sub) {
    const cleanSub = sub === 'demo' ? 'cap-burger' : sub;
    return `/${cleanSub}${suffix}`;
  }
  const legacyMenuMatch = /^menu-([a-zA-Z0-9_-]+)$/.exec(root);
  if (legacyMenuMatch) {
    const cleanSub = legacyMenuMatch[1] === 'demo' ? 'cap-burger' : legacyMenuMatch[1];
    return `/${cleanSub}${suffix}`;
  }

  return `/${pathOnly}${suffix}`;
}

/**
 * Parses a URL pathname into a strongly typed ParsedRoute.
 */
export function parsePathRoute(pathname: string): ParsedRoute {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  const segments = clean.split('/').filter(Boolean);
  const root = segments[0] || '';
  const sub = segments[1] || '';

  if (!root || root === 'home') {
    return { page: 'home', path: '/' };
  }

  if (root === 'services' || root === 'steps' || root === 'pricing' || root === 'faq') {
    return { page: 'home', scrollSection: root, path: `/${root}` };
  }

  if (root === 'demo' || root === 'menu-demo') {
    return {
      page: 'menu',
      restaurantId: 'demo',
      isSlug: false,
      path: '/cap-burger',
    };
  }

  if (root === 'login') return { page: 'login', path: '/login' };
  if (root === 'signup') return { page: 'signup', path: '/signup' };
  if (root === 'forgot') return { page: 'forgot', path: '/forgot' };
  if (root === 'onboard') return { page: 'onboard', path: '/onboard' };

  // Menu-slug scoped dashboard route: /:slug/dashboard/:tab?
  if (
    segments.length >= 2 &&
    sub.toLowerCase() === 'dashboard' &&
    !RESERVED_TOP_SEGMENTS.has(root.toLowerCase())
  ) {
    let decodedSlug = root;
    try {
      decodedSlug = decodeURIComponent(root);
    } catch {
      // keep raw
    }
    const tabSeg = (segments[2] || 'home').toLowerCase();
    const tab = DASHBOARD_SEGMENT_TO_TAB[tabSeg] || 'home';
    return {
      page: 'dashboard',
      tab,
      menuSlug: decodedSlug,
      isAppearanceShortcut: tabSeg === 'lay' || tabSeg === 'appearance',
      path: getDashboardTabPath(tab, undefined, decodedSlug),
    };
  }

  if (root === 'dashboard') {
    if (sub === 'b' && segments[2]) {
      let decodedBranch = segments[2];
      try {
        decodedBranch = decodeURIComponent(segments[2]);
      } catch {
        // keep raw segment
      }
      const tabSeg = segments[3] || 'home';
      const tab = DASHBOARD_SEGMENT_TO_TAB[tabSeg] || 'home';
      return {
        page: 'dashboard',
        tab,
        branchId: decodedBranch,
        isAppearanceShortcut: tabSeg === 'lay' || tabSeg === 'appearance',
        path: getDashboardTabPath(tab, decodedBranch),
      };
    }
    const tab = DASHBOARD_SEGMENT_TO_TAB[sub] || 'home';
    return {
      page: 'dashboard',
      tab,
      isAppearanceShortcut: sub === 'lay' || sub === 'appearance',
      path: getDashboardTabPath(tab),
    };
  }

  if (root === 'admin') {
    const tab = resolveAdminTab(sub);
    return {
      page: 'admin',
      tab,
      path: getAdminTabPath(tab),
    };
  }

  if (root === 'menu' && sub) {
    return {
      page: 'menu',
      restaurantId: sub,
      isSlug: false,
      path: `/menu/${sub}`,
    };
  }

  const legacyMenuMatch = /^menu-([a-zA-Z0-9_-]+)$/.exec(root);
  if (legacyMenuMatch) {
    return {
      page: 'menu',
      restaurantId: legacyMenuMatch[1],
      isSlug: false,
      path: `/menu/${legacyMenuMatch[1]}`,
    };
  }

  // Clean custom slug top-level route (e.g. /cap-burger)
  if (segments.length === 1 && root && !RESERVED_TOP_SEGMENTS.has(root.toLowerCase())) {
    return {
      page: 'menu',
      restaurantId: root,
      isSlug: true,
      path: `/${root}`,
    };
  }

  return { page: 'home', path: '/' };
}

/**
 * Seamlessly upgrades any legacy hash URL (e.g. /#/login or /#menu-demo) to clean Path Routing.
 */
export function migrateLegacyHashToPath(): boolean {
  const hash = window.location.hash;
  if (!hash || hash === '#') return false;

  const rawHash = hash.slice(1);
  // Preserve query parameters embedded in hash (e.g. #menu-demo?table=5)
  const [hashPath, hashQuery] = rawHash.split('?');
  const targetPath = normalizeRouteTarget(hashPath);

  const mergedSearch = new URLSearchParams(window.location.search);
  if (hashQuery) {
    const extra = new URLSearchParams(hashQuery);
    extra.forEach((val, key) => {
      if (!mergedSearch.has(key)) mergedSearch.set(key, val);
    });
  }
  const searchStr = mergedSearch.toString();
  const nextUrl = `${targetPath}${searchStr ? `?${searchStr}` : ''}`;

  window.history.replaceState(null, '', nextUrl);
  return true;
}
