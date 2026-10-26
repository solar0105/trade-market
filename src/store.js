import { useSyncExternalStore } from 'react';
import { subscribe, getVersion } from './state.js';

/** 组件里调用一次，就能在 state 变化时自动重画 */
export function useStore() {
  useSyncExternalStore(subscribe, getVersion);
}