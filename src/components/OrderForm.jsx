import { state, availableGold, availableQty } from '../state.js';
import { setSide, placeOrder } from '../actions.js';
import { fmt } from '../format.js';
import { toast } from '../toast.js';

export default function OrderForm({ price, setPrice, qty, setQty }) {
  const isBuy = state.side === 'buy';
  const priceNum = parseInt(price, 10) || 0;
  const qtyNum = parseInt(qty, 10) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = placeOrder(priceNum, qtyNum);
    if (!result.ok) {
      toast(result.message, 'bad');
      return;
    }
    toast(result.message);
  };

  return (
    <form className="order-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="seg">
        <button
          type="button"
          className={isBuy ? 'on' : ''}
          onClick={() => setSide('buy')}
        >
          买入
        </button>
        <button
          type="button"
          className={isBuy ? '' : 'on'}
          onClick={() => setSide('sell')}
        >
          卖出
        </button>
      </div>

      <div className="field">
        <label htmlFor="order-price">价格（金币）</label>
        <div className="input-wrap">
          <input
            id="order-price"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
          />
          <span>金币</span>
        </div>
      </div>

      <div className="field">
        <label htmlFor="order-qty">数量（件）</label>
        <div className="input-wrap">
          <input
            id="order-qty"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))}
          />
          <span>件</span>
        </div>
      </div>

      <div className="calc">
        <span>合计</span>
        <b>{fmt(priceNum * qtyNum)} 金币</b>
      </div>
      <div className="calc calc-lined">
        <span>可用余额</span>
        <b>
          {isBuy
            ? `${fmt(availableGold())} 金币`
            : `${fmt(availableQty(state.activeSkuId))} 件`}
        </b>
      </div>

      <button type="submit" className={`cta${isBuy ? '' : ' sell'}`}>
        {isBuy ? '挂买单' : '挂卖单'}
      </button>
    </form>
  );
}
