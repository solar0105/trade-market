import { useEffect, useState } from 'react';
import { useStore } from './store.js';
import { activeSku } from './state.js';

import Topbar from './components/Topbar.jsx';
import SkuList from './components/SkuList.jsx';
import Quote from './components/Quote.jsx';
import CandleChart from './components/CandleChart.jsx';
import OrderBook from './components/OrderBook.jsx';
import TradeTape from './components/TradeTape.jsx';
import OrderForm from './components/OrderForm.jsx';
import MyOrders from './components/MyOrders.jsx';
import Holdings from './components/Holdings.jsx';
import MyFills from './components/MyFills.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  useStore();

  const sku = activeSku();
  const [price, setPrice] = useState(String(sku.last));
  const [qty, setQty] = useState('5');

  useEffect(() => {
    setPrice(String(sku.last));
  }, [sku.id]);

  return (
    <>
      <Topbar />

      <div className="app-body">
        <aside className="rail rail-left">
          <div className="rail-head">
            <span>标的</span>
            <span>最新 / 涨跌</span>
          </div>
          <SkuList />
          <div className="rail-note">
            <b>标的口径</b><br />
            同一 SKU 内的道具完全可互换，价格与数量均为整数。
          </div>
        </aside>

        <main className="center">
          <Quote />
          <CandleChart />
          <div className="low-split">
            <OrderBook onPickPrice={setPrice} />
            <TradeTape />
          </div>
        </main>

        <aside className="rail rail-right">
          <OrderForm price={price} setPrice={setPrice} qty={qty} setQty={setQty} />
          <MyOrders />
          <Holdings />
          <MyFills />
        </aside>
      </div>

      <Footer />
      <Toast />
    </>
  );
}
