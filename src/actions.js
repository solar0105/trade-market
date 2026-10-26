import { state, activeSku, availableGold, availableQty, emit } from './state.js';
import { SKUS } from './mock.js';
import { fmt } from './format.js';

/** 全部返回 { ok, message }，不碰 DOM */

export function switchSku(skuId) {
  if (skuId === state.activeSkuId) return null;
  state.activeSkuId = skuId;
  emit();
  return { ok: true };
}

export function setSide(side) {
  state.side = side;
  emit();
}

export function placeOrder(price, qty) {
  const sku = activeSku();
  const isBuy = state.side === 'buy';

  if (!Number.isInteger(price) || price <= 0) {
    return { ok: false, message: '价格要是大于 0 的整数' };
  }
  if (!Number.isInteger(qty) || qty <= 0) {
    return { ok: false, message: '数量要是大于 0 的整数' };
  }

  if (isBuy) {
    const need = price * qty;
    if (need > availableGold()) {
      return { ok: false, message: `金币不够：要 ${fmt(need)}，可用 ${fmt(availableGold())}` };
    }
  } else {
    const have = availableQty(sku.id);
    if (qty > have) {
      return { ok: false, message: `持仓不够：要卖 ${fmt(qty)} 件，可用 ${fmt(have)} 件` };
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

  emit();

  return {
    ok: true,
    message: isBuy
      ? `已挂买单：${sku.name} ${fmt(price)} × ${fmt(qty)}`
      : `已挂卖单：${sku.name} ${fmt(price)} × ${fmt(qty)}`,
  };
}

export function cancelOrder(id) {
  const index = state.orders.findIndex((o) => o.id === id);
  if (index === -1) return { ok: false, message: '委托不存在' };

  const [order] = state.orders.splice(index, 1);
  emit();

  const sku = SKUS.find((s) => s.id === order.skuId);

  return { ok: true, message: `已撤单：${sku.name} ${fmt(order.price)} × ${fmt(order.qty)}` };
}
