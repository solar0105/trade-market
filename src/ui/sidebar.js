import { el } from '../dom.js';
import { state, frozenGold, frozenQty, activeSku, activeMarket } from '../state.js';
import { SKUS } from '../mock.js';
import { fmt, fmtPct } from '../format.js';

export function renderSkuList() {
  el('sku-list').innerHTML = SKUS.map((s) => {
    const active = s.id === state.activeSkuId ? ' on' : '';
    const tone = s.changePct >= 0 ? 'up' : 'down';
    return `
      <div class="sku${active}" data-id="${s.id}" role="button" tabindex="0">
        <div class="tick">${s.tick}</div>
        <div class="sku-main"><b>${s.name}</b><small>${s.kind}</small></div>
        <div class="sku-quote">
          <div class="num">${fmt(s.last)}</div>
          <small class="${tone}">${fmtPct(s.changePct)}</small>
        </div>
      </div>`;
  }).join('');
}

export function renderMyOrders() {
  const orders = state.orders;
  el('orders-count').textContent = `${orders.length} 笔`;

  if (orders.length === 0) {
    el('my-orders').innerHTML =
      `<div class="empty">还没有委托。左边盘口点一个价格，或者直接填价格数量挂一单。</div>`;
    return;
  }

  el('my-orders').innerHTML = orders.map((o) => {
    const isBuy = o.side === 'buy';
    const sku = SKUS.find((s) => s.id === o.skuId);
    return `
      <div class="myorder">
        <span class="side ${isBuy ? 'b' : 's'}">${isBuy ? '买' : '卖'}</span>
        <span class="txt">${sku.name} <b>${fmt(o.price)}</b> × ${fmt(o.qty)} · 未成交</span>
        <button type="button" class="kill" data-id="${o.id}">撤单</button>
      </div>`;
  }).join('');
}

export function renderHoldings() {
  const rows = SKUS
    .filter((s) => (state.inventory[s.id] || 0) > 0 || frozenQty(s.id) > 0)
    .map((s) => {
      const frozen = frozenQty(s.id);
      const note = frozen > 0 ? ` <small>挂单占用 ${fmt(frozen)}</small>` : '';
      return `
        <div class="holding">
          <span>${s.name}</span>
          <span class="num">${fmt(state.inventory[s.id] || 0)} 件${note}</span>
        </div>`;
    });

  rows.push(`
    <div class="holding">
      <span>金币</span>
      <span class="num">${fmt(state.gold)}${frozenGold() > 0 ? ` <small>挂单占用 ${fmt(frozenGold())}</small>` : ''}</span>
    </div>`);

  el('holdings').innerHTML = rows.join('');
}

export function renderFills() {
  el('fills').innerHTML = activeMarket().fills.map((f) => `
    <div class="fill">
      <span class="t">${f.time}</span>
      <span class="n">${f.side === 'buy' ? '买' : '卖'} ${activeSku().name}</span>
      <span class="p">${fmt(f.price)} × ${fmt(f.qty)}</span>
    </div>`).join('');
}