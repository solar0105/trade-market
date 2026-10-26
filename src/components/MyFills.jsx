import { activeMarket, activeSku } from '../state.js';
import { fmt } from '../format.js';

export default function MyFills() {
  const fills = activeMarket().fills;
  const sku = activeSku();

  return (
    <section className="block block-grow">
      <div className="panel-h">
        <span>我的成交</span>
        <span>今日</span>
      </div>

      {fills.map((fill) => (
        <div className="fill" key={fill.time}>
          <span className="t">{fill.time}</span>
          <span className="n">
            {fill.side === 'buy' ? '买' : '卖'} {sku.name}
          </span>
          <span className="p">
            {fmt(fill.price)} × {fmt(fill.qty)}
          </span>
        </div>
      ))}

      <div className="rail-foot">
        成交手续费 0%
        <br />
        撮合在内存完成，成交后按序号回放。
      </div>
    </section>
  );
}
