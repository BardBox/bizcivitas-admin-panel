import { useState, useRef, useEffect } from "react";
import { FaUsers, FaCalendarAlt, FaUserShield } from "react-icons/fa";
import { FiDownload, FiChevronDown } from "react-icons/fi";
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
import api from "../../api/api"; // Make sure you have your API instance configured

const colorStyles = {
  blue: { border: "border-blue-500", bg: "bg-gradient-to-br from-blue-50 to-white", text: "text-blue-600" },
  green: { border: "border-green-500", bg: "bg-gradient-to-br from-green-50 to-white", text: "text-green-600" },
  yellow: { border: "border-yellow-500", bg: "bg-gradient-to-br from-yellow-50 to-white", text: "text-yellow-600" },
};

// 🔹 Static Revenue Data
const paymentData = [
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

const UserDetailsPage = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userStats, setUserStats] = useState({
    receivedReferrals: 0,
    givenReferrals: 0,
    receivedTYFCB: 0,
    givenTYFCB: 0
  });
  const [loading, setLoading] = useState(true);
  const availableYears = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await api.get('/dashboard/user-referralstate/67c99ac9b1b00b42acf0c1fd');
        if (response.data.success) {
          setUserStats(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  const stats = [
    { title: "Received Referrals", value: userStats.receivedReferrals, color: "blue", icon: <FaUsers /> },
    { title: "Given Referrals", value: userStats.givenReferrals, color: "green", icon: <FaCalendarAlt /> },
    { title: "Given TYFCB", value: userStats.givenTYFCB, color: "yellow", icon: <FaUserShield /> },
  ];

  const downloadCSV = () => {
    const csvHeader = "Month,Revenue\n";
    const csvRows = paymentData.map((row) => `${row.month},${row.revenue}`).join("\n");
    const csvContent = `${csvHeader}${csvRows}`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `User_Revenue_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8">
      {/* Incremental Stats Section */}
      <div className="flex flex-row items-center gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`w-full rounded-3xl p-8 text-center shadow-lg border-2 
            ${colorStyles[stat.color as keyof typeof colorStyles].border} 
            ${colorStyles[stat.color as keyof typeof colorStyles].bg}`}
          >
            <div className="flex flex-col items-center">
              <div className={`text-6xl mb-4 ${colorStyles[stat.color as keyof typeof colorStyles].text}`}>
                {stat.icon}
              </div>
              <h3 className={`text-2xl font-semibold mb-2 ${colorStyles[stat.color as keyof typeof colorStyles].text}`}>
                {stat.title}
              </h3>
              <p className={`text-5xl font-extrabold ${colorStyles[stat.color as keyof typeof colorStyles].text}`}>
                {loading ? "..." : stat.value}+
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="bg-blue-50 mt-8 p-6 rounded-lg shadow-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">User Revenue ({selectedYear})</h2>
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

        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paymentData}>
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
    </div>
  );
};

export default UserDetailsPage;