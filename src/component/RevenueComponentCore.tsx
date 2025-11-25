import { useState, useEffect, useRef } from "react";
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
import { FiDownload, FiChevronDown } from "react-icons/fi";
import api from "../api/api";

interface PaymentData {
  month: string;
  revenue: number;
}

const dummyPaymentData: PaymentData[] = [
  { month: "Jan", revenue: 5000 },
  { month: "Feb", revenue: 7000 },
  { month: "Mar", revenue: 6500 },
  { month: "Apr", revenue: 8000 },
  { month: "May", revenue: 9000 },
  { month: "Jun", revenue: 11000 },
  { month: "Jul", revenue: 9500 },
  { month: "Aug", revenue: 10500 },
  { month: "Sep", revenue: 12000 },
  { month: "Oct", revenue: 13000 },
  { month: "Nov", revenue: 14000 },
  { month: "Dec", revenue: 15000 },
];

const generateYears = (startYear: number, futureYears: number) => {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + futureYears;
  return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
};

const RevenueComponentCore = () => {
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const startYear = 2015;
  const futureYears = 100;
  const availableYears = generateYears(startYear, futureYears);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const response = await api.get(`/dashboard/payment-stats?year=${selectedYear}`);
        const data = response.data;

        if (data.success && data.data) {
          setPaymentData(
            data.data.map((item: { totalAmount: number; month: string }) => ({
              month: item.month,
              revenue: item.totalAmount,
            }))
          );
        } else {
          throw new Error("No payment statistics found");
        }
      } catch (error: any) {
        setPaymentData(dummyPaymentData);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [selectedYear]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const downloadCSV = () => {
    if (paymentData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const csvHeader = "Month,Revenue\n";
    const csvRows = paymentData.map((row) => `${row.month},${row.revenue}`).join("\n");
    const csvContent = `${csvHeader}${csvRows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Core_Revenue_Report_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-blue-50 bg-opacity-75 mx-10 md:p-6 rounded-lg shadow-md w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">Core Members Revenue ({selectedYear})</h2>
        <div className="flex items-center gap-4">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="border px-4 py-2 rounded-md flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition"
            >
              {selectedYear} <FiChevronDown />
            </button>
            {dropdownOpen && (
              <div className="absolute top-12 left-0 w-36 bg-white shadow-lg border rounded-md max-h-60 overflow-auto z-10">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    className={`w-full text-left px-4 py-2 hover:bg-blue-100 ${
                      year === selectedYear ? "bg-blue-200 font-bold" : ""
                    }`}
                    onClick={() => {
                      setSelectedYear(year);
                      setDropdownOpen(false);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white bg-blue-500 hover:bg-blue-700 transition"
          >
            <FiDownload size={20} /> Download CSV
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-blue-600">Loading revenue data...</p>}

      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={paymentData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#305dfb" strokeWidth={3} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueComponentCore;