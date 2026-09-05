import type { StoragePort } from '../../ports';

export function browserStorage(storage: Storage = localStorage): StoragePort {
  return { get: (key) => storage.getItem(key), set: (key, value) => storage.setItem(key, value), remove: (key) => storage.removeItem(key) };
}
