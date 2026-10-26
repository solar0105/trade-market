import { state } from '../state.js';
import { fmt } from '../format.js';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="mark">霜</div>
      <div className="brand">
        <b>霜落行会 · 交易行</b>
        <span>第三服 · 秩序之环</span>
      </div>

      <nav className="nav">
        <a className="on" href="#">市场</a>
        <a href="#">委托</a>
        <a href="#">持仓</a>
        <a href="#">记录</a>
      </nav>

      <div className="spacer" />

      <div className="wallet" title="可用金币">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="6.4" stroke="#D9A566" strokeWidth="1.2" />
          <path
            d="M8 4.6v6.8M10.1 6.2c-.5-.8-1.3-1-2.1-1-1 0-1.7.5-1.7 1.3 0 1.9 4 1 4 2.9 0 .8-.8 1.3-1.8 1.3-.9 0-1.7-.4-2.1-1.1"
            stroke="#D9A566"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
        <span className="num">{fmt(state.gold)}</span>
      </div>

      <div className="who">
        <span className="dot" />
        <span>夜行者</span>
      </div>
    </header>
  );
}
