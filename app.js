'use strict';

/* =========================================================
   霜落行会 · 交易行 —— 前端（交互版）
   ---------------------------------------------------------
   这一版把界面点活了，但**没有撮合**：挂出去的委托只会躺在
   「我的委托」里，不会成交。撮合要等后端的订单簿，那是下一步。

   所有的「市场数据」都是本地生成的演示数据，固定种子，刷新不变。

   依赖（本地文件，见 vendor/）：
     dayjs              —— 日期处理     MIT
     lightweight-charts —— K 线图表     Apache-2.0 (TradingView)

   两条硬约定：
   1. 金额和数量一律整数（金币 / 件），不用浮点。
   2. 一个 SKU 内部完全可互换。
   ========================================================= */

/* =========================================================
   一、标的定义
   ========================================================= */

const SKUS = [
  { id: 'iron',    tick: '矿', name: '铁矿石',   kind: '材料',     last: 6,    changePct:  1.2, stock: 0 },
  { id: 'potion',  tick: '药', name: '治疗药水', kind: '消耗品',   last: 12,   changePct: -0.8, stock: 0 },
  { id: 'armor',   tick: '甲', name: '铁甲',     kind: '装备',     last: 47,   changePct:  3.1, stock: 3 },
  { id: 'sword',   tick: '剑', name: '精钢长剑', kind: '装备',     last: 74,   changePct:  2.8, stock: 12 },
  { id: 'crystal', tick: '晶', name: '魔法水晶', kind: '稀有材料', last: 1042, changePct:  6.4, stock: 0 },
];

/* =========================================================
   二、状态：整个页面只有这一份可变数据
   ========================================================= */

const state = {
  activeSkuId: 'sword',
  side: 'buy',          // 'buy' | 'sell'
  gold: 12480,
  inventory: {},        // skuId -> 持有件数
  orders: [],           // 我的委托（跨标的）
  nextOrderId: 1001,
  markets: {},          // skuId -> { asks, bids, trades, fills, quote }
};

/* =========================================================
   三、小工具
   ========================================================= */

const el = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString('zh-CN');
const fmtPct = (p) => (p >= 0 ? '+' : '') + p.toFixed(1) + '%';

const activeSku = () => SKUS.find((s) => s.id === state.activeSkuId);
const activeMarket = () => state.markets[state.activeSkuId];

/** 冻结的金币 = 所有未成交买单的 价格 × 剩余数量 */
function frozenGold() {
  return state.orders
    .filter((o) => o.side === 'buy')
    .reduce((sum, o) => sum + o.price * (o.qty - o.filled), 0);
}

/** 某个标的冻结的件数 = 所有未成交卖单的剩余数量 */
function frozenQty(skuId) {
  return state.orders
    .filter((o) => o.side === 'sell' && o.skuId === skuId)
    .reduce((sum, o) => sum + (o.qty - o.filled), 0);
}

const availableGold = () => state.gold - frozenGold();
const availableQty = (skuId) => (state.inventory[skuId] || 0) - frozenQty(skuId);

/* ---------- 轻提示 ---------- */
let toastTimer = null;

function toast(message, kind = 'ok') {
  const box = el('toast');
  box.textContent = message;
  box.className = `toast show ${kind}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.className = 'toast'; }, 2600);
}

/* =========================================================
   四、生成演示行情（固定种子，刷新不变）
   ========================================================= */

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad2 = (n) => String(n).padStart(2, '0');

function hms(totalSeconds) {
  const s = ((totalSeconds % 86400) + 86400) % 86400;
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

/** 给一个标的造出盘口、成交、我的历史成交 */
function buildMarket(sku, seed) {
  const rng = mulberry32(seed);
  const step = Math.max(1, Math.round(sku.last * 0.004));

  // 卖单由高到低排，最后一档是最低要价
  const asks = [];
  for (let i = 4; i >= 1; i--) {
    asks.push({ price: sku.last + i * step, qty: 1 + Math.floor(rng() * 22) });
  }

  // 买单由高到低排，第一档是最高出价
  const bids = [];
  for (let i = 1; i <= 4; i++) {
    bids.push({ price: Math.max(1, sku.last - i * step), qty: 1 + Math.floor(rng() * 22) });
  }

  const bestAsk = asks[asks.length - 1].price;
  const bestBid = bids[0].price;

  // 最近成交
  const trades = [];
  let clock = 22 * 3600 + 14 * 60 + 3;
  for (let i = 0; i < 13; i++) {
    const isBuy = rng() > 0.45;
    trades.push({
      time: hms(clock),
      price: isBuy ? bestAsk : bestBid,
      qty: 1 + Math.floor(rng() * 9),
      side: isBuy ? 'buy' : 'sell',
    });
    clock -= 2 + Math.floor(rng() * 7);
  }

  // 我的历史成交（演示用，3 笔）
  const fills = [];
  let fclock = 22 * 3600 + 9 * 60 + 12;
  for (let i = 0; i < 3; i++) {
    const isBuy = rng() > 0.5;
    fills.push({
      time: hms(fclock),
      side: isBuy ? 'buy' : 'sell',
      price: isBuy ? bestAsk : bestBid,
      qty: 1 + Math.floor(rng() * 5),
    });
    fclock -= 90 + Math.floor(rng() * 600);
  }

  const change = Math.round((sku.last * sku.changePct) / 100);
  const volume = 800 + Math.floor(rng() * 1800);

  return {
    asks,
    bids,
    trades,
    fills,
    quote: {
      last: sku.last,
      change,
      changePct: sku.changePct,
      high: sku.last + step * 3,
      low: Math.max(1, sku.last - step * 4),
      volume,
      openOrders: asks.reduce((a, l) => a + l.qty, 0) + bids.reduce((a, l) => a + l.qty, 0),
      turnover: volume * sku.last,
    },
  };
}

function initState() {
  SKUS.forEach((sku, i) => {
    state.inventory[sku.id] = sku.stock;
    state.markets[sku.id] = buildMarket(sku, 9001 + i * 37);
  });
}

/* =========================================================
   五、渲染
   ========================================================= */

function renderTopbar() {
  el('wallet-gold').textContent = fmt(state.gold);
  el('player-name').textContent = '夜行者';
}

function renderSkuList() {
  el('sku-list').innerHTML = SKUS.map((s) => {
    const active = s.id === state.activeSkuId ? ' on' : '';
    const tone = s.changePct >= 0 ? 'up' : 'down';
    return `
      <div class="sku${active}" data-id="${s.id}" role="button" tabindex="0">
        <div class="tick">${s.tick}</div>
        <div class="sku-main">
          <b>${s.name}</b>
          <small>${s.kind}</small>
        </div>
        <div class="sku-quote">
          <div class="num">${fmt(s.last)}</div>
          <small class="${tone}">${fmtPct(s.changePct)}</small>
        </div>
      </div>`;
  }).join('');
}

function renderQuote() {
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

/** 一行挂单，带 data-price 供点击填价 */
function bookRowHTML(side, level, maxQty, isBest) {
  const width = Math.round((level.qty / maxQty) * 100);
  return `
    <div class="row ${side}${isBest ? ' best' : ''}" data-price="${level.price}" title="点击填入价格">
      <span class="px">${fmt(level.price)} 金币</span>
      <span class="qty">${fmt(level.qty)} 件</span>
      <i class="bar" style="width:${width}%"></i>
    </div>`;
}

function renderBook() {
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

function renderTrades() {
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

function renderMyOrders() {
  const orders = state.orders;
  el('orders-count').textContent = `${orders.length} 笔`;

  if (orders.length === 0) {
    el('my-orders').innerHTML = `
      <div class="empty">还没有委托。左边盘口点一个价格，或者直接填价格数量挂一单。</div>`;
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

function renderHoldings() {
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

function renderFills() {
  const fills = activeMarket().fills;
  el('fills').innerHTML = fills.map((f) => `
    <div class="fill">
      <span class="t">${f.time}</span>
      <span class="n">${f.side === 'buy' ? '买' : '卖'} ${activeSku().name}</span>
      <span class="p">${fmt(f.price)} × ${fmt(f.qty)}</span>
    </div>`).join('');
}

function renderMeta() {
  el('meta-seq').textContent = fmt(184203);
  el('meta-push').textContent = '100ms';
  el('meta-latency').textContent = '0.8ms';
}

/** 下单面板的合计、可用余额、按钮文案 */
function renderOrderForm() {
  const price = parseInt(el('order-price').value, 10) || 0;
  const qty = parseInt(el('order-qty').value, 10) || 0;
  const isBuy = state.side === 'buy';

  el('order-total').textContent = `${fmt(price * qty)} 金币`;

  el('order-available').textContent = isBuy
    ? `${fmt(availableGold())} 金币`
    : `${fmt(availableQty(state.activeSkuId))} 件`;

  const button = el('submit-order');
  button.textContent = isBuy ? '挂买单' : '挂卖单';
  button.classList.toggle('sell', !isBuy);
}

function renderAll() {
  renderTopbar();
  renderSkuList();
  renderQuote();
  renderBook();
  renderTrades();
  renderMyOrders();
  renderHoldings();
  renderFills();
  renderMeta();
  renderOrderForm();
}

/* =========================================================
   六、K 线
   ========================================================= */

/** 按 base 价格造一段走势，收在 base 上 */
function buildCandles(base) {
  const rng = mulberry32(20261020);
  const k = Math.max(1, base / 74);        // 价格越高，波动幅度等比放大

  const segments = [
    { len: 18, drift:  0.42, vol: 1.9 },
    { len:  9, drift: -0.55, vol: 2.2 },
    { len: 15, drift:  0.34, vol: 1.7 },
    { len:  8, drift: -0.18, vol: 2.4 },
    { len: 10, drift:  0.62, vol: 1.5 },
  ];

  const candles = [];
  let price = Math.max(2, Math.round(base * 0.68));

  for (const seg of segments) {
    for (let i = 0; i < seg.len; i++) {
      const open = price;
      const close = Math.round(open + (seg.drift + (rng() - 0.5) * seg.vol * 2) * k);
      const high = Math.round(Math.max(open, close) + rng() * k * 1.2);
      const low = Math.max(1, Math.round(Math.min(open, close) - rng() * k * 1.2));
      candles.push({ open, close, high, low, volume: 90 + rng() * 320 });
      price = close;
    }
  }

  // 平移，让最后一根收在当前价
  const last = candles[candles.length - 1];
  const shift = base - last.close;
  for (const c of candles) {
    c.open += shift;
    c.close += shift;
    c.high += shift;
    c.low += shift;
  }

  // 每根蜡烛一个自然日
  const total = candles.length;
  candles.forEach((c, i) => {
    c.time = dayjs().subtract(total - 1 - i, 'day').format('YYYY-MM-DD');
  });

  return candles;
}

let chartApi = null;
let candleSeries = null;
let volumeSeries = null;

function initChart() {
  const box = el('chart');
  if (!box) return;

  if (typeof LightweightCharts === 'undefined') {
    box.textContent = '图表库未加载';
    return;
  }

  chartApi = LightweightCharts.createChart(box, {
    autoSize: true,
    layout: {
      background: { type: 'solid', color: '#16120E' },
      textColor: '#6E6052',
      fontFamily: 'Consolas, "Cascadia Mono", monospace',
      fontSize: 10,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: 'rgba(217,165,102,.05)' },
      horzLines: { color: 'rgba(217,165,102,.05)' },
    },
    rightPriceScale: {
      borderColor: '#2C241B',
      scaleMargins: { top: 0.08, bottom: 0.26 },
    },
    timeScale: {
      borderColor: '#2C241B',
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(217,165,102,.30)', width: 1, style: 2, labelBackgroundColor: '#D9A566' },
      horzLine: { color: 'rgba(217,165,102,.30)', width: 1, style: 2, labelBackgroundColor: '#D9A566' },
    },
    localization: {
      locale: 'zh-CN',
      priceFormatter: (p) => p.toFixed(0),
    },
  });

  candleSeries = chartApi.addCandlestickSeries({
    upColor: '#74B08D',
    downColor: '#C86A52',
    borderUpColor: '#74B08D',
    borderDownColor: '#C86A52',
    wickUpColor: '#74B08D',
    wickDownColor: '#C86A52',
    priceLineColor: '#D9A566',
    priceLineStyle: 2,
  });

  volumeSeries = chartApi.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
    priceLineVisible: false,
    lastValueVisible: false,
  });
  chartApi.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  updateChart();
}

function updateChart() {
  if (!chartApi) return;

  const base = activeSku().last;
  const candles = buildCandles(base);

  candleSeries.setData(candles.map((c) => ({
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
  })));

  volumeSeries.setData(candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(116,176,141,.28)' : 'rgba(200,106,82,.28)',
  })));

  chartApi.timeScale().fitContent();
}

/* =========================================================
   七、动作
   ========================================================= */

function switchSku(skuId) {
  if (skuId === state.activeSkuId) return;

  state.activeSkuId = skuId;

  // 价格框跟着换到新标的的最新价
  const sku = SKUS.find((s) => s.id === skuId);
  el('order-price').value = String(sku.last);

  renderAll();
  updateChart();
}

function placeOrder() {
  const sku = activeSku();
  const price = parseInt(el('order-price').value, 10);
  const qty = parseInt(el('order-qty').value, 10);
  const isBuy = state.side === 'buy';

  if (!Number.isInteger(price) || price <= 0) {
    return toast('价格要是大于 0 的整数', 'bad');
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    return toast('数量要是大于 0 的整数', 'bad');
  }

  if (isBuy) {
    const need = price * qty;
    if (need > availableGold()) {
      return toast(`金币不够：要 ${fmt(need)}，可用 ${fmt(availableGold())}`, 'bad');
    }
  } else {
    const have = availableQty(sku.id);
    if (qty > have) {
      return toast(`持仓不够：要卖 ${fmt(qty)} 件，可用 ${fmt(have)} 件`, 'bad');
    }
  }

  state.orders.push({
    id: state.nextOrderId++,
    skuId: sku.id,
    side: state.side,
    price,
    qty,
    filled: 0,
  });

  renderAll();
  toast(isBuy
    ? `已挂买单：${sku.name} ${fmt(price)} × ${fmt(qty)}（不会成交，等后端撮合）`
    : `已挂卖单：${sku.name} ${fmt(price)} × ${fmt(qty)}（不会成交，等后端撮合）`);
}

function cancelOrder(id) {
  const index = state.orders.findIndex((o) => o.id === id);
  if (index === -1) return;

  const order = state.orders[index];
  state.orders.splice(index, 1);
  renderAll();

  const sku = SKUS.find((s) => s.id === order.skuId);
  toast(`已撤单：${sku.name} ${fmt(order.price)} × ${fmt(order.qty)}`);
}

function setSide(side) {
  state.side = side;

  [...el('side-switch').children].forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.side === side);
  });

  renderOrderForm();
}

/* =========================================================
   八、事件绑定（用事件委托，重渲染不会丢监听）
   ========================================================= */

function bindEvents() {
  // 左栏切换标的
  el('sku-list').addEventListener('click', (e) => {
    const node = e.target.closest('.sku');
    if (node) switchSku(node.dataset.id);
  });

  // 键盘也能切换
  el('sku-list').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const node = e.target.closest('.sku');
    if (!node) return;
    e.preventDefault();
    switchSku(node.dataset.id);
  });

  // 点盘口某一档 → 填进价格框
  el('book').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    el('order-price').value = row.dataset.price;
    renderOrderForm();
  });

  // 撤单
  el('my-orders').addEventListener('click', (e) => {
    const btn = e.target.closest('.kill');
    if (btn) cancelOrder(Number(btn.dataset.id));
  });

  // 买卖切换
  el('side-switch').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) setSide(btn.dataset.side);
  });

  // 输入只留数字，并实时更新合计
  ['order-price', 'order-qty'].forEach((id) => {
    el(id).addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      renderOrderForm();
    });
  });

  // 提交
  el('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    placeOrder();
  });
}

/* =========================================================
   九、启动
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initState();
  el('order-price').value = String(activeSku().last);
  el('order-qty').value = '5';

  renderAll();
  bindEvents();
  initChart();
});
