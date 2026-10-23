import dayjs from 'dayjs';
import { hms } from './format.js';

export const SKUS = [
  { id: 'iron',    tick: '矿', name: '铁矿石',   kind: '材料',     last: 6,    changePct:  1.2, stock: 0 },
  { id: 'potion',  tick: '药', name: '治疗药水', kind: '消耗品',   last: 12,   changePct: -0.8, stock: 0 },
  { id: 'armor',   tick: '甲', name: '铁甲',     kind: '装备',     last: 47,   changePct:  3.1, stock: 3 },
  { id: 'sword',   tick: '剑', name: '精钢长剑', kind: '装备',     last: 74,   changePct:  2.8, stock: 12 },
  { id: 'crystal', tick: '晶', name: '魔法水晶', kind: '稀有材料', last: 1042, changePct:  6.4, stock: 0 },
];

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 给一个标的造盘口、成交、我的历史成交 */
export function buildMarket(sku, seed) {
  const rng = mulberry32(seed);
  const step = Math.max(1, Math.round(sku.last * 0.004));

  const asks = [];
  for (let i = 4; i >= 1; i--) {
    asks.push({ price: sku.last + i * step, qty: 1 + Math.floor(rng() * 22) });
  }

  const bids = [];
  for (let i = 1; i <= 4; i++) {
    bids.push({ price: Math.max(1, sku.last - i * step), qty: 1 + Math.floor(rng() * 22) });
  }

  const bestAsk = asks[asks.length - 1].price;
  const bestBid = bids[0].price;

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
    asks, bids, trades, fills,
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

/** 按 base 价格造 60 天走势，收在 base 上 */
export function buildCandles(base) {
  const rng = mulberry32(20261020);
  const k = Math.max(1, base / 74);

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

  const last = candles[candles.length - 1];
  const shift = base - last.close;
  for (const c of candles) {
    c.open += shift; c.close += shift; c.high += shift; c.low += shift;
  }

  const total = candles.length;
  candles.forEach((c, i) => {
    c.time = dayjs().subtract(total - 1 - i, 'day').format('YYYY-MM-DD');
  });

  return candles;
}