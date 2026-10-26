import { SKUS, buildMarket } from './mock.js';

/** 全站唯一的状态源。别的模块只读它，改它必须走 actions.js */
export const state = {
  activeSkuId: 'sword',
  side: 'buy',
  gold: 12480,
  inventory: {},
  orders: [],
  nextOrderId: 1001,
  markets: {},
};

export const activeSku = () => SKUS.find((s) => s.id === state.activeSkuId);
export const activeMarket = () => state.markets[state.activeSkuId];

export function frozenGold() {
  return state.orders
    .filter((o) => o.side === 'buy')
    .reduce((sum, o) => sum + o.price * (o.qty - o.filled), 0);
}

export function frozenQty(skuId) {
  return state.orders
    .filter((o) => o.side === 'sell' && o.skuId === skuId)
    .reduce((sum, o) => sum + (o.qty - o.filled), 0);
}

export const availableGold = () => state.gold - frozenGold();
export const availableQty = (skuId) => (state.inventory[skuId] || 0) - frozenQty(skuId);

export function initState() {
  SKUS.forEach((sku, i) => {
    state.inventory[sku.id] = sku.stock;
    state.markets[sku.id] = buildMarket(sku, 9001 + i * 37);
  });
}

/* ---------- 订阅：让 React 知道数据变了 ---------- */
const listeners = new Set();
let version = 0;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion() {
  return version;
}

export function emit() {
  version += 1;
  listeners.forEach((fn) => fn());
}