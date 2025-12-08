import React, { useState, useEffect } from "react";
import { FaUsers, FaCalendarAlt, FaUserShield } from "react-icons/fa";
import api from "../api/api"; // ✅ Import custom axios instance

const colorStyles: Record<string, { border: string; bg: string; text: string }> = {
  blue: { border: "border-blue-500", bg: "bg-gradient-to-br from-blue-50 to-white", text: "text-blue-600" },
  green: { border: "border-green-500", bg: "bg-gradient-to-br from-green-50 to-white", text: "text-green-600" },
  yellow: { border: "border-yellow-500", bg: "bg-gradient-to-br from-yellow-50 to-white", text: "text-yellow-600" },
};

const Incrementalcore: React.FC = () => {
  const [counts, setCounts] = useState({ referrals: 0, users: 0, community: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/core-members/dashboard/");
        const data = response.data;

        if (data.success && data.data) {
          setCounts({
            referrals: data.data.totalReferBy || 0,
            users: data.data.totalConnections || 0,
            community: data.data.communities || 0,
          });
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error: any) {
        console.error("Error fetching stats:", error.response?.data?.message || error.message);
      }
    };

    fetchStats();
  }, []);

  // ✅ Incremental Counter Animation
  const [animatedCounts, setAnimatedCounts] = useState({ referrals: 0, users: 0, community: 0 });

  useEffect(() => {
    const animateCounters = (key: keyof typeof counts) => {
      let start = 0;
      const end = counts[key];
      if (start === end) return;

      const increment = Math.ceil(end / 50);
      const interval = setInterval(() => {
        start += increment;
        if (start >= end) {
          start = end;
          clearInterval(interval);
        }
        setAnimatedCounts((prev) => ({ ...prev, [key]: start }));
      }, 50);
    };

    animateCounters("referrals");
    animateCounters("users");
    animateCounters("community");
  }, [counts]);

  const stats = [
    { title: "Referrals", value: animatedCounts.referrals, color: "blue", icon: <FaUsers /> },
    { title: "Connections", value: animatedCounts.users, color: "green", icon: <FaCalendarAlt /> },
    { title: "Community", value: animatedCounts.community, color: "yellow", icon: <FaUserShield /> },
  ];

  return (
    <div className="flex flex-row items-center gap-6 p-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`w-full rounded-3xl p-8 text-center shadow-lg transform transition-all duration-500 hover:scale-105 border-2 
          ${colorStyles[stat.color].border} ${colorStyles[stat.color].bg}`}
        >
          <div className="flex flex-col items-center">
            {/* Icon */}
            <div className={`text-6xl mb-4 ${colorStyles[stat.color].text}`}>{stat.icon}</div>

            {/* Title */}
            <h3 className={`text-2xl font-semibold mb-2 ${colorStyles[stat.color].text}`}>{stat.title}</h3>

            {/* Animated Number */}
            <p className={`text-5xl font-extrabold ${colorStyles[stat.color].text}`}>{stat.value}+</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Incrementalcore;
