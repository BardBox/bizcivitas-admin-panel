import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Users,
  Award,
  UserPlus,
} from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";
import BizWinAnalytics from "../BizWinAnalytics";
import ReferralAnalytics from "../ReferralAnalytics";
// import BizConnectAnalytics from "../BizConnectAnalytics"; // Hidden until backend endpoint is ready

interface StatCardData {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
  subtitle?: string;
}

export default function ComprehensiveDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // State for different stats
  const [bizWinOverview, setBizWinOverview] = useState({ totalRecords: 0, totalAmount: 0 });
  const [bizConnectOverview, setBizConnectOverview] = useState({ totalMeetups: 0, last15DaysCount: 0 });
  const [referralOverview, setReferralOverview] = useState({ totalReferrals: 0, last15DaysCount: 0 });

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBizWinOverview(),
        fetchBizConnectOverview(),
        fetchReferralOverview(),
      ]);
    } catch (error: any) {
      console.error("Dashboard error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBizWinOverview = async () => {
    try {
      const response = await api.get("/record/");
      if (response.data.success) {
        const records = response.data.data;
        const totalAmount = records.reduce((sum: number, record: any) => sum + (record.amount || 0), 0);
        setBizWinOverview({
          totalRecords: records.length,
          totalAmount
        });
      }
    } catch (error) {
      console.error("Error fetching BizWin overview:", error);
    }
  };

  const fetchBizConnectOverview = async () => {
    try {
      const [allTimeRes, last15DaysRes] = await Promise.all([
        api.get("/meetup/all-time-count"),
        api.get("/meetup/meeting-count"),
      ]);

      if (allTimeRes.data.success && last15DaysRes.data.success) {
        setBizConnectOverview({
          totalMeetups: allTimeRes.data.data.totalMeetupCount || 0,
          last15DaysCount: last15DaysRes.data.data.last15DaysMeetupCount || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching BizConnect overview:", error);
    }
  };

  const fetchReferralOverview = async () => {
    try {
      const response = await api.get("/referrals");

      if (response.data.success) {
        const referrals = response.data.data || [];
        const now = new Date();
        const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

        const last15Days = referrals.filter((r: any) =>
          new Date(r.createdAt) >= fifteenDaysAgo
        ).length;

        setReferralOverview({
          totalReferrals: referrals.length,
          last15DaysCount: last15Days,
        });
      }
    } catch (error) {
      console.error("Error fetching Referral overview:", error);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Overview Stats Cards
  const overviewCards: StatCardData[] = [
    {
      title: "BizWin Transactions",
      value: bizWinOverview.totalRecords || 0,
      subtitle: formatCurrency(bizWinOverview.totalAmount || 0),
      icon: Award,
      color: "#3b82f6",
      bgColor: "from-blue-500 to-blue-600",
    },
    {
      title: "BizConnect Meetups",
      value: bizConnectOverview.totalMeetups || 0,
      subtitle: `${bizConnectOverview.last15DaysCount || 0} in last 15 days`,
      icon: Users,
      color: "#8b5cf6",
      bgColor: "from-purple-500 to-purple-600",
    },
    {
      title: "Member Referrals",
      value: referralOverview.totalReferrals || 0,
      subtitle: `${referralOverview.last15DaysCount || 0} in last 15 days`,
      icon: UserPlus,
      color: "#10b981",
      bgColor: "from-green-500 to-green-600",
    },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
          Comprehensive Admin Dashboard
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Complete overview of BizWin, BizConnect, and Invite Analytics
        </Typography>
      </Box>

      {/* Overview Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} md={4} key={index}>
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
                        {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                      </Typography>
                      {card.subtitle && (
                        <Typography sx={{ color: "#64748b", fontSize: 12, mt: 1 }}>
                          {card.subtitle}
                        </Typography>
                      )}
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

      {/* Tabs for Detailed Views */}
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: "1px solid #e2e8f0",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 16,
            },
          }}
        >
          <Tab label="BizWin Analytics" />
          <Tab label="BizConnect Analytics" />
          <Tab label="Invite Analytics" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* BizWin Tab */}
          {activeTab === 0 && (
            <Box>
              <BizWinAnalytics />
            </Box>
          )}

          {/* BizConnect Tab */}
          {activeTab === 1 && (
            <Box>
              <ReferralAnalytics />
            </Box>
          )}

          {/* Invite Analytics Tab - Coming Soon */}
          {activeTab === 2 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                textAlign: "center",
              }}
            >
              <Users size={80} color="#8b5cf6" style={{ marginBottom: 24, opacity: 0.5 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
                Coming Soon
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b", maxWidth: "500px" }}>
                Invite Analytics is currently under development. This feature will provide detailed insights into invitation patterns and conversion metrics.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
