import type { NavigationPort } from '../../ports';

export const browserNavigation: NavigationPort = { go: (path) => { window.location.href = path; }, back: () => window.history.back() };
