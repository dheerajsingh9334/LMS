"use client";
import { useEffect, useRef } from "react";
import { Chart } from "chart.js";

// Define the props interface
interface DoughnutChartProps {
  labels: string[];
  data: number[];
}

const DoughnutChart: React.FC<DoughnutChartProps> = ({ labels, data }) => {
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

    chartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            borderColor: [
              "rgb(59, 130, 246)",  // Blue
              "rgb(34, 197, 94)",   // Green
              "rgb(249, 115, 22)",  // Orange
              "rgb(168, 85, 247)",  // Purple
              "rgb(236, 72, 153)",  // Pink
            ],
            backgroundColor: [
              "rgba(59, 130, 246, 0.8)",
              "rgba(34, 197, 94, 0.8)",
              "rgba(249, 115, 22, 0.8)",
              "rgba(168, 85, 247, 0.8)",
              "rgba(236, 72, 153, 0.8)",
            ],
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
            position: 'bottom',
            labels: {
              padding: 10,
              font: {
                size: 12,
              },
              usePointStyle: true,
              boxWidth: 15,
            }
          }
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
      <h3 className="text-sm font-semibold mb-3 text-gray-700">Course Progress</h3>
      <div className="relative w-full" style={{ height: '320px' }}>
        <canvas ref={canvasRef} className="w-full h-full"></canvas>
      </div>
    </div>
  );
};

export default DoughnutChart;
