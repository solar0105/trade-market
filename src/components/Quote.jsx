import { activeSku, activeMarket } from '../state.js';
import { fmt } from '../format.js';

export default function Quote() {
  const sku = activeSku();
  const q = activeMarket().quote;
  const tone = q.changePct >= 0 ? 'up' : 'down';
  const sign = q.changePct >= 0 ? '+' : '';

  return (
    <section className="quote">
      <div className="q-name">
        <b>{sku.name}</b>
        <span>{sku.kind} · 按件计价</span>
      </div>

      <div className="q-price">
        <span className="num">{fmt(q.last)}</span>
        <em>金币</em>
      </div>

      <div className="q-chg">
        <small>今日</small>
        <span className={`num ${tone}`}>
          {sign}{fmt(q.change)} / {sign}{q.changePct.toFixed(2)}%
        </span>
      </div>

      <div className="q-meta">
        <div><small>最高</small><span className="num">{fmt(q.high)}</span></div>
        <div><small>最低</small><span className="num">{fmt(q.low)}</span></div>
        <div><small>成交量</small><span className="num">{fmt(q.volume)}</span></div>
        <div><small>挂单</small><span className="num">{fmt(q.openOrders)}</span></div>
      </div>
    </section>
  );
}
