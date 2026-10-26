import { activeMarket } from '../state.js';
import { fmt } from '../format.js';

export default function TradeTape() {
  const trades = activeMarket().trades;

  return (
    <section className="trades">
      <div className="panel-h">
        <span>最近成交</span>
        <span>实时</span>
      </div>

      <div className="cols">
        <span>时间</span>
        <span>价格</span>
        <span>数量</span>
        <span />
      </div>

      <div className="trades-body">
        {trades.map((t) => {
          const tone = t.side === 'buy' ? 'up' : 'down';
          return (
            <div className="trade" key={t.time}>
              <span className="t">{t.time}</span>
              <span className={`px ${tone}`}>{fmt(t.price)}</span>
              <span className="q">{fmt(t.qty)}</span>
              <span className={`s ${tone}`}>{t.side === 'buy' ? '买' : '卖'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
