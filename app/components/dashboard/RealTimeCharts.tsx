"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { SystemInfo } from "~/types/metrics";

const CHART_HISTORY_SIZE = 30;

/**
 * Custom hook to encapsulate D3 initialization and update logic.
 */
const useD3Chart = (
  data: number[],
  chartId: string,
  color: string,
  historySize: number,
  isD3Ready: boolean
) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const initializeChart = useCallback(
    (svg: any, width: number, height: number) => {
      const chartMargin = { top: 10, right: 30, bottom: 20, left: 40 };
      const innerWidth = width - chartMargin.left - chartMargin.right;
      const innerHeight = height - chartMargin.top - chartMargin.bottom;

      svg.selectAll("*").remove();

      const g = svg
        .append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

      const xScale = d3
        .scaleLinear()
        .domain([0, historySize - 1])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      const line = d3
        .line<number>()
        .x((_d, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveBasis);

      g.append("g")
        .attr("class", "x-axis text-gray-400")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(xScale)
            .ticks(5)
            .tickFormat((d) => `${historySize - Number(d)}s`)
        );

      g.append("g")
        .attr("class", "y-axis text-gray-400")
        .call(d3.axisLeft(yScale).ticks(5));

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - chartMargin.left)
        .attr("x", 0 - innerHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("fill", color)
        .text("Usage (%)");

      g.append("defs")
        .append("clipPath")
        .attr("id", `clip-${chartId}`)
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

      g.append("path")
        .attr("class", `line-${chartId}`)
        .attr("clip-path", `url(#clip-${chartId})`)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2);

      if (svgRef.current) {
        (svgRef.current as any).xScale = xScale;
        (svgRef.current as any).yScale = yScale;
        (svgRef.current as any).line = line;
      }
    },
    [chartId, color, historySize]
  );

  useEffect(() => {
    if (!isD3Ready || !svgRef.current) return;

    const container = svgRef.current.parentNode as HTMLElement | null;
    if (!container) return;

    const width = container.clientWidth;
    const height = 250;

    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);

    initializeChart(svg, width, height);

    const handleResize = () => {
      if (!svgRef.current) return;
      const newWidth = container.clientWidth;
      d3.select(svgRef.current).attr("width", newWidth);
      initializeChart(d3.select(svgRef.current), newWidth, height);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initializeChart, isD3Ready]);

  useEffect(() => {
    if (!isD3Ready || !svgRef.current || data.length === 0) return;

    const { line, xScale } = svgRef.current as any;
    if (!line) return;

    d3.select(svgRef.current)
      .select(`.line-${chartId}`)
      .datum(data)
      .attr("d", line)
      .attr("transform", null)
      .transition()
      .duration(990)
      .ease(d3.easeLinear)
      .attr("transform", `translate(${xScale(1) - xScale(0)}, 0)`);
  }, [data, chartId, isD3Ready]);

  return svgRef;
};

interface RealTimeChartsProps {
  systemInfo: SystemInfo;
}

/**
 * Client Component: Real-time D3 charts for CPU and RAM history
 */
export function RealTimeCharts({ systemInfo }: RealTimeChartsProps) {
  const [isD3Ready] = useState<boolean>(true); // D3 is now imported as module
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [ramHistory, setRamHistory] = useState<number[]>([]);

  const cpuChartRef = useD3Chart(
    cpuHistory,
    "cpu-chart",
    "#4f46e5",
    CHART_HISTORY_SIZE,
    isD3Ready
  );
  const ramChartRef = useD3Chart(
    ramHistory,
    "ram-chart",
    "#10b981",
    CHART_HISTORY_SIZE,
    isD3Ready
  );

  useEffect(() => {
    if (!isD3Ready) return;

    const fetchMetrics = () => {
      // TODO: Replace with actual API call
      const cpuBase = 10 + Math.random() * 20;
      const ramBaseGB = 6 + Math.random() * 4;

      const cpuUsage = Math.min(100, cpuBase + Math.random() * 15);
      const ramPercent = (ramBaseGB / systemInfo.ramTotal) * 100;

      setCpuHistory((prev) => [...prev, cpuUsage].slice(-CHART_HISTORY_SIZE));
      setRamHistory((prev) => [...prev, ramPercent].slice(-CHART_HISTORY_SIZE));
    };

    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, [isD3Ready, systemInfo.ramTotal]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-6 text-indigo-400">Real-Time History</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="chart-container p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-indigo-400">
            CPU Utilization History (%)
          </h3>
          <svg id="cpu-chart" className="w-full h-64" ref={cpuChartRef}></svg>
        </div>
        <div className="chart-container p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2 text-green-400">
            Memory Usage History (%)
          </h3>
          <svg id="ram-chart" className="w-full h-64" ref={ramChartRef}></svg>
        </div>
      </div>
    </div>
  );
}
