import { activeMarket } from '../state.js';
import { fmt } from '../format.js';

function Row({ side, level, maxQty, isBest, onPick }) {
  const width = Math.round((level.qty / maxQty) * 100);

  return (
    <div
      className={`row ${side}${isBest ? ' best' : ''}`}
      onClick={() => onPick(level.price)}
      title="点击填入价格"
    >
      <span className="px">{fmt(level.price)} 金币</span>
      <span className="qty">{fmt(level.qty)} 件</span>
      <i className="bar" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function OrderBook({ onPickPrice }) {
  const { asks, bids, quote } = activeMarket();
  const maxQty = Math.max(...asks.map((l) => l.qty), ...bids.map((l) => l.qty));

  const bestAsk = asks[asks.length - 1];
  const bestBid = bids[0];
  const spread = bestAsk.price - bestBid.price;

  return (
    <section className="book">
      <div className="panel-h">
        <span>盘口</span>
        <span>挂出来的买卖单</span>
      </div>

      <div className="book-body">
        <div className="side-h">
          <i style={{ background: 'var(--sell)' }} />
          卖家要价<small>想卖的人挂多少</small>
        </div>
        {asks.map((level, i) => (
          <Row key={level.price} side="ask" level={level}
               maxQty={maxQty} isBest={i === asks.length - 1} onPick={onPickPrice} />
        ))}

        <div className="midway">
          现在还未成交：最便宜的要价 <b>{fmt(bestAsk.price)}</b>，
          最高的出价 <b>{fmt(bestBid.price)}</b>，差 {fmt(spread)} 金币
        </div>

        <div className="side-h">
          <i style={{ background: 'var(--buy)' }} />
          买家出价<small>想买的人愿出多少</small>
        </div>
        {bids.map((level, i) => (
          <Row key={level.price} side="bid" level={level}
               maxQty={maxQty} isBest={i === 0} onPick={onPickPrice} />
        ))}
      </div>

      <div className="book-foot">
        <span>今日成交 <b>{fmt(quote.volume)}</b> 件</span>
        <span>成交额 <b>{fmt(quote.turnover)}</b> 金币</span>
      </div>
    </section>
  );
}
