import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiDownload } from "react-icons/fi";
import api from "../api/api";

interface PaymentData {
  month: string;
  revenue: number;
}

const RevenueComponent: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${currentYear}-12-31`);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!startDate || !endDate) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          `/dashboard/payment-stats?startDate=${startDate}&endDate=${endDate}`
        );
        const data = response.data;

        if (data.success && data.data) {
          const raw: PaymentData[] = data.data.map(
            (item: { totalAmount: number; month: string }) => ({
              month: item.month.trim(),
              revenue: item.totalAmount,
            })
          );

          const getMonthList = (start: string, end: string): string[] => {
            const result: string[] = [];
            const startDateObj = new Date(start);
            const endDateObj = new Date(end);

            startDateObj.setDate(1);
            endDateObj.setDate(1);

            while (startDateObj <= endDateObj) {
              const label = `${startDateObj.toLocaleString("default", {
                month: "short",
              })}-${String(startDateObj.getFullYear()).slice(2)}`;
              result.push(label);
              startDateObj.setMonth(startDateObj.getMonth() + 1);
            }

            return result;
          };

          const allMonths = getMonthList(startDate, endDate);

          const filledData = allMonths.map((monthLabel) => {
            const found = raw.find((item) => item.month === monthLabel);
            return found || { month: monthLabel, revenue: 0 };
          });

          setPaymentData(filledData);
        } else {
          throw new Error("No payment statistics found");
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [startDate, endDate]);

  const downloadCSV = () => {
    if (paymentData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const csvHeader = "Month,Revenue\n";
    const csvRows = paymentData
      .map((row) => `"${row.month}",${row.revenue}`)
      .join("\n");
    const csvContent = `${csvHeader}${csvRows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Revenue_Report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic line and dot size based on screen width
  const isMobile = window.innerWidth < 640;
  const strokeWidth = isMobile ? 2 : 3;
  const dotRadius = isMobile ? 4 : 5;

  return (
    <div className=" p-4 sm:p-6 rounded-lg shadow-md w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Company Revenue
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
          Loading revenue data...
        </p>
      )}
      {error && (
        <p className="text-center text-red-700 text-base sm:text-lg">
          Error: {error}
        </p>
      )}

      {!loading && !error && paymentData.length > 0 && (
        <div className="w-full h-[300px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={paymentData}
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
                tickFormatter={(value) => `₹${value.toLocaleString()}`}
                tick={{ fontSize: 12, fill: "#4A5568" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <Tooltip
                formatter={(value) => [`₹${value.toLocaleString()}`, "Revenue"]}
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#14b8a6"
                strokeWidth={strokeWidth}
                dot={{ r: dotRadius, fill: "#14b8a6", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!loading && !error && paymentData.length === 0 && (
        <p className="text-center text-gray-600 text-base sm:text-lg">
          No revenue data available.
        </p>
      )}
    </div>
  );
};

export default RevenueComponent;
