"use client";
import { useEffect, useRef } from "react";
import { Chart } from "chart.js";

interface LineChartProps {
  labels: string[];
  data: number[];
  title?: string;
  isCurrency?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  labels,
  data,
  title = "Chart",
  isCurrency = false,
}) => {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const formatValue = (value: number | string) => {
      if (!isCurrency) return value;
      const numeric = typeof value === "string" ? Number(value) : value;
      if (Number.isNaN(numeric)) return value;
      return `₹${numeric.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;
    };

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            borderColor: "rgb(34, 197, 94)",
            borderWidth: 2,
            pointRadius: 2,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: { display: false },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: (value: string | number) => formatValue(value),
              },
              gridLines: { color: "rgba(0,0,0,0.05)" },
            },
          ],
          xAxes: [
            {
              gridLines: { color: "rgba(0,0,0,0.02)" },
            },
          ],
        },
        tooltips: {
          enabled: true,
          callbacks: {
            label: (tooltipItem: any) => {
              return String(formatValue(tooltipItem.yLabel));
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, data, isCurrency]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">{title}</h3>
      <div className="relative w-full" style={{ height: "320px" }}>
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

export default LineChart;
