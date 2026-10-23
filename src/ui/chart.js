import { createChart, CrosshairMode } from 'lightweight-charts';
import { el } from '../dom.js';
import { activeSku } from '../state.js';
import { buildCandles } from '../mock.js';

let chartApi = null;
let candleSeries = null;
let volumeSeries = null;

export function initChart() {
  const box = el('chart');
  if (!box) return;


  chartApi = createChart(box, {
    autoSize: true,
    layout: {
      background: { type: 'solid', color: '#16120E' },
      textColor: '#6E6052',
      fontFamily: 'Consolas, "Cascadia Mono", monospace',
      fontSize: 10,
      attributionLogo: false,
    },
    grid: {
      vertLines: { color: 'rgba(217,165,102,.05)' },
      horzLines: { color: 'rgba(217,165,102,.05)' },
    },
    rightPriceScale: {
      borderColor: '#2C241B',
      scaleMargins: { top: 0.08, bottom: 0.26 },
    },
    timeScale: {
      borderColor: '#2C241B',
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: 'rgba(217,165,102,.30)', width: 1, style: 2, labelBackgroundColor: '#D9A566' },
      horzLine: { color: 'rgba(217,165,102,.30)', width: 1, style: 2, labelBackgroundColor: '#D9A566' },
    },
    localization: {
      locale: 'zh-CN',
      priceFormatter: (p) => p.toFixed(0),
    },
  });

  candleSeries = chartApi.addCandlestickSeries({
    upColor: '#74B08D', downColor: '#C86A52',
    borderUpColor: '#74B08D', borderDownColor: '#C86A52',
    wickUpColor: '#74B08D', wickDownColor: '#C86A52',
    priceLineColor: '#D9A566',
    priceLineStyle: 2,
  });

  volumeSeries = chartApi.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
    priceLineVisible: false,
    lastValueVisible: false,
  });
  chartApi.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  updateChart();
}

export function updateChart() {
  if (!chartApi) return;

  const candles = buildCandles(activeSku().last);

  candleSeries.setData(candles.map((c) => ({
    time: c.time, open: c.open, high: c.high, low: c.low, close: c.close,
  })));

  volumeSeries.setData(candles.map((c) => ({
    time: c.time,
    value: c.volume,
    color: c.close >= c.open ? 'rgba(116,176,141,.28)' : 'rgba(200,106,82,.28)',
  })));

  chartApi.timeScale().fitContent();
}