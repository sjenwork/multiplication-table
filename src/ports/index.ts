export interface StoragePort { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void; }
export interface HapticsPort { vibrate(durationMs?: number): void; }
export interface DownloadPort { download(filename: string, content: string, mimeType?: string): void; }
export interface NavigationPort { go(path: string): void; back(): void; }
export interface PwaUpdatePort { hasWaitingUpdate(): boolean; onUpdateAvailable(listener: () => void): () => void; update(): Promise<void>; }
export interface ViewportPort { getSize(): { width: number; height: number }; scrollTo(x: number, y: number): void; }
