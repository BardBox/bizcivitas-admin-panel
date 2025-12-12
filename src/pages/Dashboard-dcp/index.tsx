import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Paper,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
  TrendingUp,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";
import axiosInstance from "../../axiosInstance";

interface Member {
  _id: string;
  fname: string;
  lname?: string;
  email: string;
  businessCategory: string;
  avatar?: string;
  membershipType: string;
  performanceScore?: number; // Added to backend response or calculated
}

interface DashboardData {
  dcp: {
    id: string;
    name: string;
    area: string;
    zone: string;
    totalMembers: number;
    performanceScore: number;
  };
  overall: {
    meetups: number;
    bizConnect: number;
    bizWin: number;
    visitor: number;
    events: number;
  };
  allMembers: Member[];
  coreGroups: any[];
}

const DashboardDCP: React.FC = () => {
  const user = getUserFromLocalStorage();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/franchise/dcp/dashboard", {
          params: { period }
        });

        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          setError("Failed to fetch dashboard data");
        }
      } catch (err: any) {
        console.error("Error fetching DCP dashboard:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) return null;

  // DCP only manages digital members
  const digitalMembers = dashboardData.allMembers || [];

  const {
    meetups = 0,
    bizConnect = 0,
    bizWin = 0,
    visitor = 0,
    events = 0
  } = dashboardData.overall || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome, {user?.fname} {user?.lname}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            DCP Dashboard - {dashboardData.dcp.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Area: {dashboardData.dcp.area} | Zone: {dashboardData.dcp.zone} |
            Members: {dashboardData.dcp.totalMembers} | Performance Score: {dashboardData.dcp.performanceScore}%
          </Typography>
        </Box>
        <Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="all-time">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Groups fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {meetups}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Offline Events</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.C. - BizConnect */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Handshake fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {bizConnect}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Referrals Exchange</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.W. - BizWin */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <EmojiEvents fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(bizWin)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Business Generated</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VISITOR - Invitations */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Visibility fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {visitor}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                VISITOR (Invitations)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">New Prospects</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* EVE - Events */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
              color: "white",
            }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Event fontSize="large" />
                <Chip
                  label={<TrendingUp fontSize="small" />}
                  size="small"
                  color="success"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {events}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                EVE (Events)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">Group Events</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Digital Members Section */}
      <Grid container spacing={3} mt={2}>
        {/* Digital Members */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Digital Members (DM)</Typography>
              <Chip
                label={digitalMembers.length}
                color="secondary"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <List>
              {digitalMembers.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No digital members found.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {digitalMembers.map((member) => (
                    <Grid item xs={12} sm={6} md={4} key={member._id}>
                      <ListItem
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          "&:hover": { backgroundColor: "#f5f5f5" },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "#4facfe" }} src={member.avatar}>
                            {member.fname?.[0] || "D"}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography variant="subtitle2" fontWeight="bold">
                                {member.fname} {member.lname}
                              </Typography>
                              {member.performanceScore !== undefined && (
                                <Chip
                                  label={`${Math.round(member.performanceScore)}%`}
                                  size="small"
                                  color="info"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {member.businessCategory}
                              </Typography>
                              <Chip
                                label={member.membershipType}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    </Grid>
                  ))}
                </Grid>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Placeholder for Upcoming Events - can be added later via API */}
        {/*
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
              ...
          </Paper>
        </Grid>
        */}
      </Grid>
    </Box>
  );
};

export default DashboardDCP;
