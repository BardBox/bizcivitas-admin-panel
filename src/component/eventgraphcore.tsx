import React, { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const GraphComponentCore: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 500, height: 200 });

  // ✅ Static Data for Graph
  const eventData = [
    { month: "Jan", oneDayTotal: 1, onlineTotal: 3, tripsTotal: 2 },
    { month: "Feb", oneDayTotal: 2, onlineTotal: 4, tripsTotal: 3 },
    { month: "Mar", oneDayTotal: 4, onlineTotal: 5, tripsTotal: 2 },
    { month: "Apr", oneDayTotal: 6, onlineTotal: 2, tripsTotal: 3 },
    { month: "May", oneDayTotal: 4, onlineTotal: 6, tripsTotal: 4 },
    { month: "Jun", oneDayTotal: 5, onlineTotal: 4, tripsTotal: 3 },
    { month: "Jul", oneDayTotal: 5, onlineTotal: 3, tripsTotal: 4 },
    { month: "Aug", oneDayTotal: 6, onlineTotal: 5, tripsTotal: 3 },
    { month: "Sep", oneDayTotal: 2, onlineTotal: 6, tripsTotal: 2 },
    { month: "Oct", oneDayTotal: 5, onlineTotal: 4, tripsTotal: 3 },
    { month: "Nov", oneDayTotal: 6, onlineTotal: 5, tripsTotal: 4 },
    { month: "Dec", oneDayTotal: 3, onlineTotal: 3, tripsTotal: 5 },
  ];

  // ✅ Handle Responsive Resize
  useEffect(() => {
    const updateChartSize = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        setChartSize({
          width: Math.max(300, width - 20),
          height: Math.max(250, height - 20),
        });
      }
    };

    updateChartSize();
    window.addEventListener("resize", updateChartSize);
    return () => window.removeEventListener("resize", updateChartSize);
  }, []);

  return (
    <div ref={chartContainerRef} className="bg-blue-50 bg-opacity-75 p-4 md:p-6 rounded-lg shadow-md w-full h-full">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-center">Attended Event Statistics (2023)</h2>

      {/* ✅ Render Static Graph */}
      <div className="w-full h-full pb-5">
        <ResponsiveContainer width="100%" height={chartSize.height} >
          <BarChart data={eventData} margin={{ top: 20, right: 20, left: 10, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="oneDayTotal" fill="#305dfb" name="One Day Events" radius={[10, 10, 0, 0]} />
            <Bar dataKey="onlineTotal" fill="#2bb225" name="Online Events" radius={[10, 10, 0, 0]} />
            <Bar dataKey="tripsTotal" fill="#e5890a" name="Trips" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GraphComponentCore;
