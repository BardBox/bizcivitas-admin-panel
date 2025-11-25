import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiDownload } from "react-icons/fi";
import api from "../api/api";

interface UserGrowthData {
  month: string;
  users: number;
}

const GraphComponent: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!startDate || !endDate) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/dashboard/user-stats?startDate=${startDate}&endDate=${endDate}`
        );
        const data = response.data;

        if (data.success && data.data) {
          const formattedData: UserGrowthData[] = data.data.userGrowth.map(
            (item: { month: string; users: number }) => ({
              month: item.month.trim(),
              users: item.users,
            })
          );

          // Format months into a consistent format for chart display
          const formattedMonthData = formattedData.map((item) => {
            const monthLabel = new Date(item.month).toLocaleString("default", {
              month: "short",
            }) + " " + new Date(item.month).getFullYear();
            return {
              ...item,
              month: monthLabel,
            };
          });

          setUserGrowthData(formattedMonthData);
        } else {
          throw new Error("No user growth data found");
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [startDate, endDate]);

  const downloadCSV = () => {
    if (userGrowthData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const csvHeader = "Month,Users\n";
    const csvRows = userGrowthData
      .map((row) => `"${row.month}",${row.users}`)
      .join("\n");
    const csvContent = `${csvHeader}${csvRows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `User_Growth_Report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic bar size based on screen width
  const barSize = window.innerWidth < 640 ? 20 : 30;

  return (
    <div className=" p-4 sm:p-6 rounded-lg shadow-md w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          User Growth
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <label className="sr-only">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-2 py-1 sm:px-3 sm:py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              min="2025-01-01"
            />
          </div>

          <div>
            <label className="sr-only">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-2 py-1 sm:px-3 sm:py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              min={startDate}
            />
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center justify-center p-2 sm:p-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-300"
            aria-label="Download CSV"
          >
            <FiDownload size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-center text-blue-700 text-base sm:text-lg">
          Loading user growth data...
        </p>
      )}
      {error && (
        <p className="text-center text-red-700 text-base sm:text-lg">
          Error: {error}
        </p>
      )}

      {!loading && !error && userGrowthData.length > 0 && (
        <div className="w-full h-[300px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={userGrowthData}
              margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="month"
                interval={0}
                height={50}
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={0}
                        y={0}
                        dy={16}
                        textAnchor="end"
                        fill="#4A5568"
                        fontSize={12}
                        transform="rotate(-30)"
                      >
                        {payload.value}
                      </text>
                    </g>
                  );
                }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tickFormatter={(value) => `${value} users`}
                tick={{ fontSize: 12, fill: "#4A5568" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <Tooltip
                formatter={(value) => [`${value} users`, "User Growth"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  fontWeight: "500",
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: "8px",
                  fontSize: "14px",
                  color: "#4A5568",
                }}
              />
              <Bar
                dataKey="users"
                fill="#14b8a6"
                barSize={barSize}
                name="User Growth"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && userGrowthData.length === 0 && (
        <p className="text-center text-gray-600 text-base sm:text-lg">
          No user growth data available.
        </p>
      )}
    </div>
  );
};

export default GraphComponent;
