import type { ViewportPort } from '../../ports';

export const browserViewport: ViewportPort = { getSize: () => ({ width: window.innerWidth, height: window.innerHeight }), scrollTo: (x, y) => window.scrollTo(x, y) };
