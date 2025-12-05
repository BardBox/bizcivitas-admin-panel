import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Typography,
} from "@mui/material";
import axiosInstance from "../../axiosInstance";
import {
  BizConnectChart,
  BizWinChart,
  MeetupsChart,
  VisitorInvitationsChart,
  EventsChart,
} from "../../components/franchise-charts";

interface ChartsViewProps {
  dashboardRole: "master-franchise" | "area-franchise";
}

const ChartsView: React.FC<ChartsViewProps> = ({ dashboardRole }) => {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart data states
  const [bizConnectData, setBizConnectData] = useState<any[]>([]);
  const [bizWinData, setBizWinData] = useState<any[]>([]);
  const [meetupsData, setMeetupsData] = useState<any[]>([]);
  const [visitorsData, setVisitorsData] = useState<any[]>([]);
  const [eventsData, setEventsData] = useState<any[]>([]);

  // Fetch all chart data
  useEffect(() => {
    const fetchChartData = async () => {
      if (dashboardRole !== "master-franchise") {
        setError("Charts are currently only available for Master Franchise partners");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const baseURL = "/franchise/mf/charts";

        // Fetch all charts in parallel
        const [
          bizConnectRes,
          bizWinRes,
          meetupsRes,
          visitorsRes,
          eventsRes,
        ] = await Promise.all([
          axiosInstance.get(`${baseURL}/bizconnect`, { params: { period } }),
          axiosInstance.get(`${baseURL}/bizwin`, { params: { period } }),
          axiosInstance.get(`${baseURL}/meetups`, { params: { period } }),
          axiosInstance.get(`${baseURL}/visitors`, { params: { period } }),
          axiosInstance.get(`${baseURL}/events`, { params: { period } }),
        ]);

        setBizConnectData(bizConnectRes.data.data || []);
        setBizWinData(bizWinRes.data.data || []);
        setMeetupsData(meetupsRes.data.data || []);
        setVisitorsData(visitorsRes.data.data || []);
        setEventsData(eventsRes.data.data || []);
      } catch (err: any) {
        console.error("Chart data fetch error:", err);
        setError(err.response?.data?.message || "Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period, dashboardRole]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Period Filter */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Performance Charts</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={period}
            label="Time Period"
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <MenuItem value="daily">Last 30 Days</MenuItem>
            <MenuItem value="weekly">Last 12 Weeks</MenuItem>
            <MenuItem value="monthly">Last 12 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Charts Grid */}
      {!loading && (
        <Grid container spacing={3}>
          {/* BizConnect Chart */}
          <Grid item xs={12} md={6}>
            <BizConnectChart data={bizConnectData} />
          </Grid>

          {/* BizWin Chart */}
          <Grid item xs={12} md={6}>
            <BizWinChart data={bizWinData} />
          </Grid>

          {/* Meetups Chart */}
          <Grid item xs={12} md={4}>
            <MeetupsChart data={meetupsData} />
          </Grid>

          {/* Visitor Invitations Chart */}
          <Grid item xs={12} md={4}>
            <VisitorInvitationsChart data={visitorsData} />
          </Grid>

          {/* Events Chart */}
          <Grid item xs={12} md={4}>
            <EventsChart data={eventsData} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ChartsView;
