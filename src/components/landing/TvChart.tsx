"use client";

import { useEffect, useRef } from "react";
import { createChart, createSeriesMarkers, ColorType, LineStyle, LineSeries, AreaSeries, type IChartApi } from "lightweight-charts";

export interface ChartSeries {
  name: string;
  color: string;
  data: { time: string; value: number }[];
}

export interface TradeMarker {
  time: string;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  text: string;
}

interface Props {
  series: ChartSeries[];
  markers?: TradeMarker[];
  height?: number;
  formatValue?: (v: number) => string;
}

export default function TvChart({ series, markers, height = 350, formatValue }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#0d0b08" },
        textColor: "#e0d4b8",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(255,255,255,0.25)", style: LineStyle.Dashed, width: 1, labelBackgroundColor: "#1a1508" },
        horzLine: { color: "rgba(255,255,255,0.25)", style: LineStyle.Dashed, width: 1, labelBackgroundColor: "#1a1508" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        textColor: "#e0d4b8",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    if (formatValue) {
      chart.applyOptions({ localization: { priceFormatter: formatValue } });
    }

    // Multi-line: use LineSeries for each
    if (series.length > 1) {
      series.forEach((s, i) => {
        if (!s.data.length) return;
        const line = chart.addSeries(LineSeries, {
          color: s.color,
          lineWidth: 2,
          title: s.name,
          crosshairMarkerRadius: 4,
          crosshairMarkerBorderColor: "#0a0906",
          crosshairMarkerBorderWidth: 2,
          priceLineVisible: i === 0,
          lastValueVisible: true,
        });
        line.setData(s.data as any);
        if (i === 0 && markers?.length) {
          createSeriesMarkers(line, markers as any);
        }
      });
    } else if (series.length === 1 && series[0].data.length) {
      // Single series: use AreaSeries for nicer fill
      const s = series[0];
      const area = chart.addSeries(AreaSeries, {
        lineColor: s.color,
        topColor: s.color + "26", // ~15% opacity
        bottomColor: "rgba(10,9,6,0)",
        lineWidth: 2,
        title: s.name,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: "#0a0906",
        crosshairMarkerBorderWidth: 2,
      });
      area.setData(s.data as any);
      if (markers?.length) {
        createSeriesMarkers(area, markers as any);
      }
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [series, markers, height, formatValue]);

  return (
    <div style={{
      width: "100%", borderRadius: 10, overflow: "hidden",
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(8px)",
      padding: 2,
    }}>
      <div ref={containerRef} style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />
    </div>
  );
}
