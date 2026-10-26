import { fmt } from '../format.js';

export default function Footer() {
  return (
    <footer className="footer">
      <span>撮合引擎 v0 · 内存订单簿</span>
      <span>快照序号 <span className="num">{fmt(184203)}</span></span>
      <span>增量推送 <span className="num">100ms</span></span>
      <span className="spacer" />
      <span>行情延迟 <span className="num">0.8ms</span></span>
      <span>状态 正常</span>
    </footer>
  );
}
