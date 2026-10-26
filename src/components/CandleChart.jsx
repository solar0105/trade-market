import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { activeSku } from '../state.js';
import { buildCandles } from '../mock.js';

export default function CandleChart() {
  const boxRef = useRef(null);
  const chartRef = useRef(null);
  const candleRef = useRef(null);
  const volumeRef = useRef(null);

  const sku = activeSku();

  // ① 只在挂载时创建一次图表
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const chart = createChart(box, {
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

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#74B08D',
      downColor: '#C86A52',
      borderUpColor: '#74B08D',
      borderDownColor: '#C86A52',
      wickUpColor: '#74B08D',
      wickDownColor: '#C86A52',
      priceLineColor: '#D9A566',
      priceLineStyle: 2,
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    // 卸载时销毁，否则组件被移除后图表还挂在内存里
    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // ② 标的一变，就换数据（挂载时也会跑一次）
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!chart) return;

    const candles = buildCandles(activeSku().last);

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(116,176,141,.28)' : 'rgba(200,106,82,.28)',
      }))
    );

    chart.timeScale().fitContent();
  }, [sku.id]);

  return (
    <div className="chart-wrap">
      <div className="chart-h">
        <b>日 K</b>
        <span>近 60 天</span>
      </div>
      <div ref={boxRef} className="chart" />
    </div>
  );
}
