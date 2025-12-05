import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import ReferralAnalytics from "../ReferralAnalytics";

interface StatCardData {
    title: string;
    value: number | string;
    icon: any;
    color: string;
    bgColor: string;
    subtitle?: string;
}

export default function AreaComprehensiveDashboard() {
    const { areaId } = useParams<{ areaId: string }>();
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [businessArea, setBusinessArea] = useState("");

    // State for different stats
    const [bizWinOverview, setBizWinOverview] = useState({ totalRecords: 0, totalAmount: 0 });
    const [bizConnectOverview, setBizConnectOverview] = useState({ totalMeetups: 0, last15DaysCount: 0 });
    const [referralOverview, setReferralOverview] = useState({ totalReferrals: 0, last15DaysCount: 0 });

    useEffect(() => {
        if (areaId) {
            fetchAreaDetails();
        }
    }, [areaId]);

    useEffect(() => {
        if (businessArea) {
            fetchAllDashboardData();
        }
    }, [businessArea]);

    const fetchAreaDetails = async () => {
        try {
            const response = await api.get(`/areas/${areaId}`);
            if (response.data.success) {
                const area = response.data.data;
                setBusinessArea(area.areaName);
            }
        } catch (error: any) {
            console.error("Error fetching area details:", error);
            toast.error("Failed to load area details");
        }
    };

    const fetchAllDashboardData = async () => {
        setLoading(true);
        try {
            const response = await api.get("/franchise/mf/area-metrics", {
                params: { businessArea }
            });

            if (response.data.success) {
                const metrics = response.data.data.metrics;

                setBizWinOverview({
                    totalRecords: metrics.bizWinTransactions.total || 0,
                    totalAmount: metrics.bizWinTransactions.totalAmount || 0
                });

                setBizConnectOverview({
                    totalMeetups: metrics.bizConnectMeetups.total || 0,
                    last15DaysCount: 0
                });

                setReferralOverview({
                    totalReferrals: metrics.memberReferrals.total || 0,
                    last15DaysCount: 0
                });
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
        return `₹${value.toLocaleString()}`;
    };

    if (loading) {
        return (
            <Box className="flex items-center justify-center h-screen">
                <CircularProgress size={60} />
            </Box>
        );
    }

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
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
                    Area Comprehensive Dashboard
                </Typography>
                <Typography variant="body1" sx={{ color: "#64748b" }}>
                    Detailed overview of BizWin, BizConnect, and Invite Analytics for this Area
                </Typography>
            </Box>

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
                    {activeTab === 0 && (
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
                            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
                                BizWin Analytics Coming Soon
                            </Typography>
                            <Typography variant="body1" sx={{ color: "#64748b", maxWidth: "500px" }}>
                                Area-based BizWin analytics are being updated. Please check back soon!
                            </Typography>
                        </Box>
                    )}

                    {activeTab === 1 && (
                        <Box>
                            <ReferralAnalytics businessArea={businessArea} />
                        </Box>
                    )}

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
                                Invite Analytics is currently under development.
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
