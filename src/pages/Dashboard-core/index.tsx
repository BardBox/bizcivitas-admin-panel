import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar,
  ListItemAvatar,
} from "@mui/material";
import {
  Groups,
  Handshake,
  EmojiEvents,
  Visibility,
  Event,
  TrendingUp,
  CalendarToday,
  Assignment,
} from "@mui/icons-material";
import Incrementalcore from "../../component/incremenral-core";
import RevenueComponentCore from "../../component/RevenueComponentCore";
import { getUserFromLocalStorage } from "../../api/auth";

// Mock data - will be replaced with real API calls
const mockPerformanceData = {
  member: {
    name: "John Doe",
    coreGroup: "Core Group Alpha",
    cgc: "Rajesh Kumar (CGC)",
    performanceScore: 88,
    memberSince: "Jan 2024",
  },
  overall: {
    meetups: 18,
    bizConnect: 24,
    bizWin: 145000,
    visitor: 12,
    events: 8,
  },
  recentActivity: [
    { type: "bizConnect", description: "Gave referral to Priya Sharma", date: "2 hours ago", icon: "handshake" },
    { type: "bizWin", description: "Received ₹15,000 TYFCB from Amit", date: "1 day ago", icon: "trophy" },
    { type: "meetup", description: "Attended weekly core group meeting", date: "2 days ago", icon: "group" },
    { type: "event", description: "Participated in Business Networking Event", date: "3 days ago", icon: "event" },
    { type: "visitor", description: "Invited visitor to meeting", date: "4 days ago", icon: "visibility" },
  ],
  upcomingTasks: [
    { title: "Weekly Core Group Meeting", date: "Dec 10, 2025", time: "10:00 AM", priority: "high" },
    { title: "Follow up with visitor", date: "Dec 11, 2025", time: "3:00 PM", priority: "medium" },
    { title: "Submit monthly BizWin report", date: "Dec 15, 2025", time: "5:00 PM", priority: "high" },
    { title: "Business Networking Event", date: "Dec 20, 2025", time: "6:00 PM", priority: "low" },
  ],
  monthlyProgress: {
    meetups: { current: 18, target: 20, percentage: 90 },
    bizConnect: { current: 24, target: 25, percentage: 96 },
    bizWin: { current: 145000, target: 150000, percentage: 96.7 },
  },
};

const DashboardCore: React.FC = () => {
  const user = getUserFromLocalStorage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case "handshake":
        return <Handshake color="primary" />;
      case "trophy":
        return <EmojiEvents color="success" />;
      case "group":
        return <Groups color="secondary" />;
      case "event":
        return <Event color="warning" />;
      case "visibility":
        return <Visibility color="info" />;
      default:
        return <Assignment />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Section */}
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.fname} {user?.lname}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Core Member Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Core Group: {mockPerformanceData.member.coreGroup} | CGC: {mockPerformanceData.member.cgc} | Performance Score:{" "}
        {mockPerformanceData.member.performanceScore}% | Member Since: {mockPerformanceData.member.memberSince}
      </Typography>

      {/* Performance Metrics Cards */}
      <Grid container spacing={3} mt={2}>
        {/* M.U. - Meetups */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Groups fontSize="large" />
                <Chip label={<TrendingUp fontSize="small" />} size="small" color="success" />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.meetups}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                M.U. (Meetups)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  {mockPerformanceData.monthlyProgress.meetups.percentage}% of target
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.C. - BizConnect */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Handshake fontSize="large" />
                <Chip label={<TrendingUp fontSize="small" />} size="small" color="success" />
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {mockPerformanceData.overall.bizConnect}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.C. (BizConnect)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  {mockPerformanceData.monthlyProgress.bizConnect.percentage.toFixed(0)}% of target
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* B.W. - BizWin */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <EmojiEvents fontSize="large" />
                <Chip label={<TrendingUp fontSize="small" />} size="small" color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(mockPerformanceData.overall.bizWin)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                B.W. (BizWin)
              </Typography>
              <Box mt={2}>
                <Typography variant="caption">
                  {mockPerformanceData.monthlyProgress.bizWin.percentage.toFixed(0)}% of target
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* VISITOR - Invitations */}
        <Grid item xs={12} md={6} lg={2.4}>
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Visibility fontSize="large" />
                <Chip label={<TrendingUp fontSize="small" />} size="small" color="success" />
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
          <Card sx={{ height: "100%", background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", color: "white" }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Event fontSize="large" />
                <Chip label={<TrendingUp fontSize="small" />} size="small" color="success" />
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

      {/* Existing Dashboard Components */}
      <Box mt={4}>
        <Incrementalcore />
      </Box>

      <Grid container spacing={3} mt={3} sx={{ height: "70vh" }}>
        <RevenueComponentCore />
      </Grid>

      {/* Activity & Tasks Section */}
      <Grid container spacing={3} mt={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockPerformanceData.recentActivity.map((activity, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "#f5f5f5" }}>{getActivityIcon(activity.icon)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="body2">{activity.description}</Typography>}
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

        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarToday />
                Upcoming Tasks & Events
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {mockPerformanceData.upcomingTasks.map((task, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    mb: 1,
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
                        <Typography variant="subtitle2" fontWeight="bold">
                          {task.title}
                        </Typography>
                        <Chip label={task.priority.toUpperCase()} size="small" color={getPriorityColor(task.priority) as any} />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {task.date} at {task.time}
                        </Typography>
                      </Box>
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

export default DashboardCore;
