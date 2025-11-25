import React, { useState, useEffect } from "react";
import { FaUsers, FaCalendarAlt, FaUserShield } from "react-icons/fa";
import api from "../api/api"; // ✅ Import the custom axios instance

// ✅ Color styles for different sections
const colorStyles: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: "border-blue-500", bg: "bg-gradient-to-br from-blue-50 to-white", text: "text-blue-600" },
  green: { border: "border-green-500", bg: "bg-gradient-to-br from-green-50 to-white", text: "text-green-600" },
  yellow: { border: "border-yellow-500", bg: "bg-gradient-to-br from-yellow-50 to-white", text: "text-yellow-600" },
};

const Incremental: React.FC = () => {
  const [counts, setCounts] = useState([0, 0, 0]);
  const [stats, setStats] = useState([
    { title: "Users", value: 0, color: "blue", icon: <FaUsers /> },
    { title: "Communities", value: 0, color: "green", icon: <FaCalendarAlt /> },
    { title: "Core Members", value: 0, color: "yellow", icon: <FaUserShield /> },
  ]);

  // ✅ Fetch data from API with authentication
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats"); // ✅ Uses `api.ts` (which includes token)
        const data = response.data;

        if (data.success) {
          setStats([
            { title: "Users", value: data.data.totalUsers, color: "blue", icon: <FaUsers /> },
            { title: "Communities", value: data.data.totalCommunities, color: "green", icon: <FaCalendarAlt /> },
            { title: "Core Members", value: data.data.totalCoreMembers, color: "yellow", icon: <FaUserShield /> },
          ]);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  // ✅ Incremental counter logic for animation
  useEffect(() => {
    const intervals = stats.map((stat, index) =>
      setInterval(() => {
        setCounts((prevCounts) => {
          const newCounts = [...prevCounts];
          if (newCounts[index] < stat.value) {
            newCounts[index] += Math.ceil(stat.value / 50); // Increment by a fraction of the total value
          } else {
            newCounts[index] = stat.value;
            clearInterval(intervals[index]);
          }
          return newCounts;
        });
      }, 50)
    );

    return () => intervals.forEach(clearInterval);
  }, [stats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 p-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`rounded-3xl p-8 flex-col items-center justify-center text-center shadow-lg transform transition-all duration-500 hover:scale-105 border-2 
          ${colorStyles[stat.color].border} ${colorStyles[stat.color].bg}`}
        >
          {/* Icon */}
          <div className="flex flex-col  items-center">

          <div className={`text-6xl flex-col items-center justify-center mb-4 ${colorStyles[stat.color].text}`}>{stat.icon}</div>

          {/* Title */}
          <h3 className={`text-2xl font-semibold mb-2 ${colorStyles[stat.color].text}`}>{stat.title}</h3>

          {/* Animated Number */}
          <p className={`text-5xl font-extrabold ${colorStyles[stat.color].text}`}>{counts[index]}+</p>
        </div>
        </div>
      ))}
    </div>
  );
};

export default Incremental;
