import { state } from '../state.js';
import { SKUS } from '../mock.js';
import { fmt, fmtPct } from '../format.js';
import { switchSku } from '../actions.js';

export default function SkuList() {
  return (
    <div className="sku-list">
      {SKUS.map((sku) => {
        const active = sku.id === state.activeSkuId ? ' on' : '';
        const tone = sku.changePct >= 0 ? 'up' : 'down';

        return (
          <div
            key={sku.id}
            className={`sku${active}`}
            role="button"
            tabIndex={0}
            onClick={() => switchSku(sku.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                switchSku(sku.id);
              }
            }}
          >
            <div className="tick">{sku.tick}</div>
            <div className="sku-main">
              <b>{sku.name}</b>
              <small>{sku.kind}</small>
            </div>
            <div className="sku-quote">
              <div className="num">{fmt(sku.last)}</div>
              <small className={tone}>{fmtPct(sku.changePct)}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
