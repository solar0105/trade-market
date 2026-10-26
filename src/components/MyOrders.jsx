import { state } from '../state.js';
import { SKUS } from '../mock.js';
import { fmt } from '../format.js';
import { cancelOrder } from '../actions.js';
import { toast } from '../toast.js';

export default function MyOrders() {
  const orders = state.orders;

  const handleCancel = (id) => {
    const result = cancelOrder(id);
    if (!result.ok) {
      toast(result.message, 'bad');
      return;
    }
    toast(result.message);
  };

  return (
    <section className="block">
      <div className="panel-h">
        <span>我的委托</span>
        <span>{orders.length} 笔</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          还没有委托。左边盘口点一个价格，或者直接填价格数量挂一单。
        </div>
      ) : (
        orders.map((order) => {
          const isBuy = order.side === 'buy';
          const sku = SKUS.find((s) => s.id === order.skuId);

          return (
            <div className="myorder" key={order.id}>
              <span className={`side ${isBuy ? 'b' : 's'}`}>
                {isBuy ? '买' : '卖'}
              </span>
              <span className="txt">
                {sku.name} <b>{fmt(order.price)}</b> × {fmt(order.qty)} · 未成交
              </span>
              <button type="button" className="kill" onClick={() => handleCancel(order.id)}>
                撤单
              </button>
            </div>
          );
        })
      )}
    </section>
  );
}
