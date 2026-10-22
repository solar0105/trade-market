import { el } from '../dom.js';
import { activeSku, activeMarket } from '../state.js';
import { fmt, fmtPct } from '../format.js';

export function renderQuote() {
  const sku = activeSku();
  const q = activeMarket().quote;
  const tone = q.change >= 0 ? 'up' : 'down';
  const sign = q.change >= 0 ? '+' : '';

  el('quote').innerHTML = `
    <div class="q-name"><b>${sku.name}</b><span>${sku.kind} · 按件计价</span></div>
    <div class="q-price"><span class="num">${fmt(q.last)}</span><em>金币</em></div>
    <div class="q-chg">
      <small>今日</small>
      <span class="num ${tone}">${sign}${fmt(q.change)} / ${sign}${q.changePct.toFixed(2)}%</span>
    </div>
    <div class="q-meta">
      <div><small>最高</small><span class="num">${fmt(q.high)}</span></div>
      <div><small>最低</small><span class="num">${fmt(q.low)}</span></div>
      <div><small>成交量</small><span class="num">${fmt(q.volume)}</span></div>
      <div><small>挂单</small><span class="num">${fmt(q.openOrders)}</span></div>
    </div>`;
}

function bookRowHTML(side, level, maxQty, isBest) {
  const width = Math.round((level.qty / maxQty) * 100);
  return `
    <div class="row ${side}${isBest ? ' best' : ''}" data-price="${level.price}" title="点击填入价格">
      <span class="px">${fmt(level.price)} 金币</span>
      <span class="qty">${fmt(level.qty)} 件</span>
      <i class="bar" style="width:${width}%"></i>
    </div>`;
}

export function renderBook() {
  const { asks, bids } = activeMarket();
  const maxQty = Math.max(...asks.map((l) => l.qty), ...bids.map((l) => l.qty));

  const bestAsk = asks[asks.length - 1];
  const bestBid = bids[0];
  const spread = bestAsk.price - bestBid.price;

  el('book').innerHTML = `
    <div class="side-h"><i style="background:var(--sell)"></i>卖家要价<small>想卖的人挂多少</small></div>
    ${asks.map((l, i) => bookRowHTML('ask', l, maxQty, i === asks.length - 1)).join('')}

    <div class="midway">
      现在还未成交：最便宜的要价 <b>${fmt(bestAsk.price)}</b>，
      最高的出价 <b>${fmt(bestBid.price)}</b>，差 ${fmt(spread)} 金币
    </div>

    <div class="side-h"><i style="background:var(--buy)"></i>买家出价<small>想买的人愿出多少</small></div>
    ${bids.map((l, i) => bookRowHTML('bid', l, maxQty, i === 0)).join('')}`;

  const q = activeMarket().quote;
  el('book-foot').innerHTML = `
    <span>今日成交 <b>${fmt(q.volume)}</b> 件</span>
    <span>成交额 <b>${fmt(q.turnover)}</b> 金币</span>`;
}

export function renderTrades() {
  el('trades').innerHTML = activeMarket().trades.map((t) => {
    const tone = t.side === 'buy' ? 'up' : 'down';
    return `
      <div class="trade">
        <span class="t">${t.time}</span>
        <span class="px ${tone}">${fmt(t.price)}</span>
        <span class="q">${fmt(t.qty)}</span>
        <span class="s ${tone}">${t.side === 'buy' ? '买' : '卖'}</span>
      </div>`;
  }).join('');
}