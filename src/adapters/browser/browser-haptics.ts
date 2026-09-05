import type { HapticsPort } from '../../ports';

export const browserHaptics: HapticsPort = { vibrate: (durationMs = 12) => { navigator.vibrate?.(durationMs); } };
