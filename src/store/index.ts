// store — the data backend used by the app. The catalogue runs fully offline,
// saving everything in this browser via IndexedDB (see localStore).
import * as localStore from './localStore';

export const store = {
  mode: 'local' as const,
  ...localStore,
};

export type Store = typeof store;
