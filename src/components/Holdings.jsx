import { state, frozenGold, frozenQty } from '../state.js';
import { SKUS } from '../mock.js';
import { fmt } from '../format.js';

export default function Holdings() {
  const rows = SKUS.filter(
    (sku) => (state.inventory[sku.id] || 0) > 0 || frozenQty(sku.id) > 0
  );

  return (
    <section className="block">
      <div className="panel-h">
        <span>持仓</span>
        <span>按标的</span>
      </div>

      {rows.map((sku) => {
        const frozen = frozenQty(sku.id);
        return (
          <div className="holding" key={sku.id}>
            <span>{sku.name}</span>
            <span className="num">
              {fmt(state.inventory[sku.id] || 0)} 件
              {frozen > 0 && <small>挂单占用 {fmt(frozen)}</small>}
            </span>
          </div>
        );
      })}

      <div className="holding">
        <span>金币</span>
        <span className="num">
          {fmt(state.gold)}
          {frozenGold() > 0 && <small>挂单占用 {fmt(frozenGold())}</small>}
        </span>
      </div>
    </section>
  );
}
