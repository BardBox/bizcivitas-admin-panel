import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  Checkbox,
} from "@mui/material";
import { Download, Search, TrendingUp, Users, Calendar, Trash2 } from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";

interface MeetupRecord {
  id: string;
  title: string;
  meetingPlace: string;
  agenda: string;
  date: string;
  time: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    membershipType?: string;
    companyName?: string;
  } | null;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    membershipType?: string;
    companyName?: string;
  }>;
  role: string;
}

type DateFilterType = "15days" | "3months" | "6months" | "tilldate";

export default function BizConnectAnalytics() {
  const [records, setRecords] = useState<MeetupRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MeetupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("tilldate");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalMeetups: 0,
    last15DaysCount: 0,
    allTimeCount: 0,
  });

  useEffect(() => {
    fetchAllRecords();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, searchQuery, dateFilter]);

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);

      const response = await api.post("/meetup/detailed-by-date", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (response.data.success) {
        const data = response.data.data.meetups || [];
        setRecords(data);

        // Calculate stats from actual data
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

        const last15DaysCount = data.filter((m: MeetupRecord) =>
          new Date(m.createdAt) >= fifteenDaysAgo
        ).length;

        setStats({
          totalMeetups: data.length,
          last15DaysCount: last15DaysCount,
          allTimeCount: data.length,
        });
      }
    } catch (error: any) {
      console.error("Error fetching meetup records:", error);
      toast.error(error.response?.data?.message || "Failed to load meetup records");
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (filter: DateFilterType) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (filter) {
      case "15days":
        startDate.setDate(endDate.getDate() - 15);
        break;
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case "tilldate":
        startDate.setFullYear(2020, 0, 1); // Start from 2020
        break;
    }

    return { startDate, endDate };
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) =>
        record.title.toLowerCase().includes(query) ||
        record.meetingPlace.toLowerCase().includes(query) ||
        record.agenda.toLowerCase().includes(query) ||
        record.createdBy?.name?.toLowerCase().includes(query) ||
        record.attendees.some((a) => a.name.toLowerCase().includes(query))
      );
    }

    setFilteredRecords(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this meetup?")) return;

    try {
      const response = await api.delete(`/meetup/${id}`);
      if (response.data.success) {
        toast.success("Meetup deleted successfully");
        fetchAllRecords();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete meetup");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one meetup to delete");
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} meetup(s)?`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/meetup/${id}`)));
      toast.success(`${selectedIds.length} meetup(s) deleted successfully`);
      setSelectedIds([]);
      fetchAllRecords();
    } catch (error: any) {
      toast.error("Failed to delete some meetups");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Date Created",
      "Title",
      "From (Creator)",
      "From Company",
      "To (Attendees)",
      "Meeting Place",
      "Agenda",
      "Meeting Date",
      "Meeting Time",
    ];

    const rows = filteredRecords.map((record) => [
      new Date(record.createdAt).toLocaleDateString(),
      record.title,
      record.createdBy?.name || "Unknown Creator",
      record.createdBy?.companyName || "N/A",
      record.attendees.map((a) => a.name).join(", ") || "No attendees",
      record.meetingPlace || "N/A",
      record.agenda || "N/A",
      new Date(record.date).toLocaleDateString(),
      record.time,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bizconnect_analytics_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>
          BizConnect Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Track and analyze meetups between connected members
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#eff6ff", border: "2px solid #3b82f6" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Calendar size={40} color="#3b82f6" />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#3b82f6" }}>
                    {stats.allTimeCount}
                  </Typography>
                  <Typography sx={{ color: "#64748b" }}>Total Meetups</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#f0fdf4", border: "2px solid #10b981" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TrendingUp size={40} color="#10b981" />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#10b981" }}>
                    {stats.last15DaysCount}
                  </Typography>
                  <Typography sx={{ color: "#64748b" }}>Last 15 Days</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: "#fef3c7", border: "2px solid #f59e0b" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Users size={40} color="#f59e0b" />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: "#f59e0b" }}>
                    {filteredRecords.length}
                  </Typography>
                  <Typography sx={{ color: "#64748b" }}>Filtered Results</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by title, place, agenda, or participant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Date Range"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as DateFilterType);
                  fetchAllRecords();
                }}
              >
                <MenuItem value="15days">Last 15 Days</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="tilldate">All Time</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              {selectedIds.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 size={18} />}
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Download size={18} />}
                onClick={exportToCSV}
                sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      filteredRecords.length > 0 &&
                      selectedIds.length === filteredRecords.length
                    }
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < filteredRecords.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>From (Creator)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To (Attendees)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Meeting Place</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Agenda</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">No meetups found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} hover selected={selectedIds.includes(record.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(record.id)}
                        onChange={(e) => handleSelectOne(record.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {new Date(record.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(record.date).toLocaleDateString()} at {record.time}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {record.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.createdBy ? (
                        <>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {record.createdBy.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {record.createdBy.companyName || "N/A"}
                          </Typography>
                          {record.createdBy.membershipType && (
                            <Chip
                              label={record.createdBy.membershipType.replace(" Membership", "")}
                              size="small"
                              sx={{
                                height: "18px",
                                fontSize: "0.65rem",
                                bgcolor: "#fef3c7",
                                color: "#92400e",
                                fontWeight: 600,
                                ml: 0.5,
                              }}
                            />
                          )}
                        </>
                      ) : (
                        <Typography variant="caption" color="textSecondary" fontStyle="italic">
                          Unknown Creator
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.attendees.length === 0 ? (
                        <Typography variant="caption" color="textSecondary">
                          No attendees
                        </Typography>
                      ) : (
                        record.attendees.slice(0, 2).map((attendee, index) => (
                          <Box key={index} sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {attendee.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {attendee.companyName || "N/A"}
                            </Typography>
                          </Box>
                        ))
                      )}
                      {record.attendees.length > 2 && (
                        <Typography variant="caption" color="primary">
                          +{record.attendees.length - 2} more
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={record.meetingPlace || "Not specified"}
                        size="small"
                        sx={{ bgcolor: "#e0f2fe", color: "#0369a1" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {record.agenda || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => handleDelete(record.id)}
                        sx={{ minWidth: "90px" }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
