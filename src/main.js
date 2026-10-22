import { state, activeSku, initState } from './state.js';
import { switchSku, setSide, placeOrder, cancelOrder } from './actions.js';
import { el } from './dom.js';
import { fmt } from './format.js';
import { toast } from './ui/toast.js';
import { renderQuote, renderBook, renderTrades } from './ui/market.js';
import { renderSkuList, renderMyOrders, renderHoldings, renderFills } from './ui/sidebar.js';
import { renderOrderForm } from './ui/order-form.js';
import { initChart, updateChart } from './ui/chart.js';

function renderTopbar() {
  el('wallet-gold').textContent = fmt(state.gold);
  el('player-name').textContent = '夜行者';
}

function renderMeta() {
  el('meta-seq').textContent = fmt(184203);
  el('meta-push').textContent = '100ms';
  el('meta-latency').textContent = '0.8ms';
}

/** 唯一的刷新入口：改完状态调它一次，别在别处零散地重绘 */
function refresh() {
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

function bindEvents() {
  // 切标的
  el('sku-list').addEventListener('click', (e) => {
    const node = e.target.closest('.sku');
    if (!node) return;
    if (!switchSku(node.dataset.id)) return;
    el('order-price').value = String(activeSku().last);
    refresh();
    updateChart();
  });

  // 键盘也能切
  el('sku-list').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const node = e.target.closest('.sku');
    if (!node) return;
    e.preventDefault();
    node.click();
  });

  // 点盘口填价格
  el('book').addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    el('order-price').value = row.dataset.price;
    renderOrderForm();
  });

  // 撤单
  el('my-orders').addEventListener('click', (e) => {
    const btn = e.target.closest('.kill');
    if (!btn) return;
    const result = cancelOrder(Number(btn.dataset.id));
    if (!result.ok) return toast(result.message, 'bad');
    refresh();
    toast(result.message);
  });

  // 买卖切换
  el('side-switch').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    setSide(btn.dataset.side);
    [...el('side-switch').children].forEach((b) => {
      b.classList.toggle('on', b.dataset.side === state.side);
    });
    renderOrderForm();
  });

  // 输入只留数字
  ['order-price', 'order-qty'].forEach((id) => {
    el(id).addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      renderOrderForm();
    });
  });

  // 提交
  el('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const price = parseInt(el('order-price').value, 10);
    const qty = parseInt(el('order-qty').value, 10);
    const result = placeOrder(price, qty);
    if (!result.ok) return toast(result.message, 'bad');
    refresh();
    toast(result.message);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initState();
  el('order-price').value = String(activeSku().last);
  el('order-qty').value = '5';
  refresh();
  bindEvents();
  initChart();
});