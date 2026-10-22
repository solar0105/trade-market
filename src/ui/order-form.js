import { el } from '../dom.js';
import { state, availableGold, availableQty } from '../state.js';
import { fmt } from '../format.js';

export function renderOrderForm() {
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