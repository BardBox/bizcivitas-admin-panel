import React from "react";
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
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
  PersonAdd,
  Star,
} from "@mui/icons-material";
import { getUserFromLocalStorage } from "../../api/auth";

// Mock data - will be replaced with real API calls
const mockPerformanceData = {
  dcp: {
    name: "DCP 1 - Tech & IT",
    area: "Andheri Area",
    zone: "Mumbai Zone",
    totalMembers: 48,
    performanceScore: 92,
  },
  overall: {
    meetups: 12,
    bizConnect: 28,
    bizWin: 185000,
    visitor: 9,
    events: 6,
  },
  members: [
    {
      id: 1,
      name: "Rahul Mehta",
      businessCategory: "Software Development",
      performanceScore: 95,
      memberSince: "Jan 2024",
      avatar: "R",
    },
    {
      id: 2,
      name: "Sneha Patel",
      businessCategory: "Digital Marketing",
      performanceScore: 92,
      memberSince: "Feb 2024",
      avatar: "S",
    },
    {
      id: 3,
      name: "Arjun Singh",
      businessCategory: "Web Design",
      performanceScore: 88,
      memberSince: "Mar 2024",
      avatar: "A",
    },
    {
      id: 4,
      name: "Priya Sharma",
      businessCategory: "Content Writing",
      performanceScore: 90,
      memberSince: "Feb 2024",
      avatar: "P",
    },
    {
      id: 5,
      name: "Vikram Desai",
      businessCategory: "IT Consulting",
      performanceScore: 86,
      memberSince: "Apr 2024",
      avatar: "V",
    },
  ],
  recentActivity: [
    {
      type: "bizConnect",
      description: "Rahul gave referral to Sneha",
      date: "2 hours ago",
    },
    {
      type: "bizWin",
      description: "Priya received ₹25,000 TYFCB",
      date: "5 hours ago",
    },
    {
      type: "meetup",
      description: "Group meetup scheduled for Dec 10",
      date: "1 day ago",
    },
    {
      type: "member",
      description: "New member joined: Vikram Desai",
      date: "2 days ago",
    },
    {
      type: "event",
      description: "Webinar on Digital Marketing",
      date: "3 days ago",
    },
  ],
  monthlyProgress: {
    meetups: { current: 12, target: 15, percentage: 80 },
    bizConnect: { current: 28, target: 30, percentage: 93 },
    bizWin: { current: 185000, target: 200000, percentage: 92.5 },
  },
};

const DashboardDCP: React.FC = () => {
  const user = getUserFromLocalStorage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "bizConnect":
        return <Handshake color="primary" />;
      case "bizWin":
        return <EmojiEvents color="success" />;
      case "meetup":
        return <Groups color="secondary" />;
      case "member":
        return <PersonAdd color="info" />;
      case "event":
        return <Event color="warning" />;
      default:
        return <Star />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.fname} {user?.lname}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        DCP Dashboard - {mockPerformanceData.dcp.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Area: {mockPerformanceData.dcp.area} | Zone:{" "}
        {mockPerformanceData.dcp.zone} | Members:{" "}
        {mockPerformanceData.dcp.totalMembers} | Performance Score:{" "}
        {mockPerformanceData.dcp.performanceScore}%
      </Typography>

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
                  label="Total"
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.meetups}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  Target: {mockPerformanceData.monthlyProgress.meetups.target}
                </Typography>
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
                  label="Total"
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.bizConnect}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  Target:{" "}
                  {mockPerformanceData.monthlyProgress.bizConnect.target}
                </Typography>
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
                  label="Total"
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(mockPerformanceData.overall.bizWin)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  Target:{" "}
                  {formatCurrency(
                    mockPerformanceData.monthlyProgress.bizWin.target
                  )}
                </Typography>
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
                  label="Total"
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.visitor}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                VISITOR (Invitations)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">This Month</Typography>
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
                  label="Total"
                  size="small"
                  sx={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.events}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                EVE (Events)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">This Month</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Members & Activity Section */}
      <Grid container spacing={3} mt={2}>
        {/* My Digital Members */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              My Digital Members
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockPerformanceData.members.map((member) => (
                <ListItem
                  key={member.id}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    mb: 1,
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#667eea" }}>{member.avatar}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Chip
                          label={`${member.performanceScore}%`}
                          size="small"
                          color="success"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {member.businessCategory}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Member since: {member.memberSince}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockPerformanceData.recentActivity.map((activity, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#f5f5f5" }}>
                      {getActivityIcon(activity.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2">
                        {activity.description}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {activity.date}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardDCP;
