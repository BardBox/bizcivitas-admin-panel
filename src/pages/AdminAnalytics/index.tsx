import { useState, useEffect } from "react";
import { Box, Grid, Card, CardContent, Typography, CircularProgress } from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  DollarSign,
  Calendar,
  UserPlus,
  Building2,
  UserCheck,
} from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";

interface DashboardStats {
  totalUsers: number;
  totalCommunities: number;
  totalCoreMembers: number;
  totalEvents: number;
}

interface UserGrowth {
  month: string;
  users: number;
}

interface PaymentData {
  month: string;
  totalAmount: number;
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const dateRange = {
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-12-31`,
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [statsRes, userGrowthRes, paymentRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get(`/dashboard/user-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
        api.get(`/dashboard/payment-stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (userGrowthRes.data.success) {
        setUserGrowth(userGrowthRes.data.data.userGrowth);
      }

      if (paymentRes.data.success) {
        setPaymentData(paymentRes.data.data);
      }
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "#3b82f6",
      bgColor: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Communities",
      value: stats?.totalCommunities || 0,
      icon: Building2,
      color: "#10b981",
      bgColor: "from-green-500 to-green-600",
    },
    {
      title: "Core Members",
      value: stats?.totalCoreMembers || 0,
      icon: UserCheck,
      color: "#f59e0b",
      bgColor: "from-amber-500 to-amber-600",
    },
    {
      title: "Total Events",
      value: stats?.totalEvents || 0,
      icon: Calendar,
      color: "#ef4444",
      bgColor: "from-red-500 to-red-600",
    },
  ];

  const totalRevenue = paymentData.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalNewUsers = userGrowth.reduce((sum, item) => sum + item.users, 0);

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
          Admin Analytics Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Platform-wide metrics and insights
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}25 100%)`,
                  border: `2px solid ${card.color}30`,
                  borderRadius: 3,
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 12px 24px ${card.color}30`,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography sx={{ color: "#64748b", fontSize: 14, mb: 1, fontWeight: 600 }}>
                        {card.title}
                      </Typography>
                      <Typography sx={{ fontSize: 32, fontWeight: 700, color: card.color }}>
                        {card.value.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={32} color="white" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Revenue & User Growth Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <DollarSign size={24} color="#10b981" />
                <Typography sx={{ ml: 1, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                  Total Revenue
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 36, fontWeight: 700, color: "#10b981" }}>
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 14, mt: 1 }}>
                Year to date ({new Date().getFullYear()})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <UserPlus size={24} color="#3b82f6" />
                <Typography sx={{ ml: 1, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
                  New Users
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 36, fontWeight: 700, color: "#3b82f6" }}>
                {totalNewUsers.toLocaleString()}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: 14, mt: 1 }}>
                Year to date ({new Date().getFullYear()})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1e293b", mb: 3 }}>
                User Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 7 }}
                    name="New Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Chart */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#1e293b", mb: 3 }}>
                Revenue Trend
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={formatCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar
                    dataKey="totalAmount"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
