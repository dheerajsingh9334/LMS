"use client";
import { useEffect, useRef } from "react";
import { Chart } from "chart.js";

// Define the props interface
interface DoughnutChartProps {
  labels: string[];
  data: number[];
  title?: string;
}

// Generate distinct colors for many categories
const generateColors = (count: number) => {
  const colors = [
    "rgb(59, 130, 246)", // Blue
    "rgb(34, 197, 94)", // Green
    "rgb(249, 115, 22)", // Orange
    "rgb(168, 85, 247)", // Purple
    "rgb(236, 72, 153)", // Pink
    "rgb(245, 158, 11)", // Amber
    "rgb(239, 68, 68)", // Red
    "rgb(20, 184, 166)", // Teal
    "rgb(99, 102, 241)", // Indigo
    "rgb(251, 146, 60)", // Orange-light
    "rgb(132, 204, 22)", // Lime
    "rgb(14, 165, 233)", // Sky
    "rgb(217, 70, 239)", // Fuchsia
    "rgb(244, 63, 94)", // Rose
    "rgb(6, 182, 212)", // Cyan
    "rgb(251, 191, 36)", // Yellow
    "rgb(139, 92, 246)", // Violet
    "rgb(234, 88, 12)", // Orange-dark
    "rgb(16, 185, 129)", // Emerald
    "rgb(244, 114, 182)", // Pink-light
  ];

  // If we need more colors, generate them dynamically
  const result = [];
  for (let i = 0; i < count; i++) {
    if (i < colors.length) {
      result.push(colors[i]);
    } else {
      // Generate additional colors using HSL
      const hue = (i * 137.508) % 360; // Golden angle
      result.push(`hsl(${hue}, 70%, 50%)`);
    }
  }
  return result;
};

const DoughnutChart: React.FC<DoughnutChartProps> = ({
  labels,
  data,
  title = "Course Progress",
}) => {
  const chartRef = useRef<Chart | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const colors = generateColors(labels.length);
    const backgroundColors = colors.map((color) =>
      color.startsWith("rgb")
        ? color.replace("rgb", "rgba").replace(")", ", 0.8)")
        : color.replace("hsl", "hsla").replace(")", ", 0.8)"),
    );

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            borderColor: colors,
            backgroundColor: backgroundColors,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 10,
              font: {
                size: 12,
              },
              usePointStyle: true,
              boxWidth: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                const total = context.dataset.data.reduce(
                  (a: number, b: number) => a + b,
                  0,
                );
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    // Cleanup function to destroy the chart when the component unmounts
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [labels, data]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold mb-3 text-gray-700">{title}</h3>
      <div className="relative w-full" style={{ height: "320px" }}>
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

export default DoughnutChart;
