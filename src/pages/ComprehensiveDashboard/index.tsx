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
  TextField,
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Users,
  Award,
  UserPlus,
  Filter,
} from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";
import ReferralAnalytics from "../ReferralAnalytics";
import BizWinAnalytics from "../BizWinAnalytics";
import BizConnectAnalytics from "../BizConnectAnalytics";
import InviteAnalytics from "../InviteAnalytics";
import { Country, State } from "country-state-city";

interface StatCardData {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
  subtitle?: string;
}

interface Zone {
  _id: string;
  zoneName: string;
  cityId: string;
  stateId: string;
  countryId: string;
}

interface Area {
  _id: string;
  areaName: string;
  zoneId: string;
}

export default function ComprehensiveDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  // Hierarchical Filter States
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [filterLevel, setFilterLevel] = useState<"platform" | "country" | "state" | "zone" | "area">("platform");

  // Country and State data
  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : [];

  // State for different stats
  const [bizWinOverview, setBizWinOverview] = useState({ totalRecords: 0, totalAmount: 0 });
  const [bizConnectOverview, setBizConnectOverview] = useState({ totalMeetups: 0, last15DaysCount: 0 });
  const [referralOverview, setReferralOverview] = useState({ totalReferrals: 0, last15DaysCount: 0 });

  useEffect(() => {
    fetchAllDashboardData();
  }, [filterLevel, selectedZone, selectedArea]);

  // Cascade: Country change → reset state, zone, area
  useEffect(() => {
    if (selectedCountry) {
      setSelectedState(null);
      setZones([]);
      setSelectedZone(null);
      setAreas([]);
      setSelectedArea(null);
      setFilterLevel("country");
    } else {
      setSelectedState(null);
      setZones([]);
      setSelectedZone(null);
      setAreas([]);
      setSelectedArea(null);
      setFilterLevel("platform");
    }
  }, [selectedCountry]);

  // Cascade: State change → fetch zones, reset zone and area
  useEffect(() => {
    if (selectedState && selectedCountry) {
      fetchZonesByCountryState(selectedCountry.name, selectedState.name);
      setSelectedZone(null);
      setAreas([]);
      setSelectedArea(null);
      setFilterLevel("state");
    } else if (selectedCountry) {
      setZones([]);
      setSelectedZone(null);
      setAreas([]);
      setSelectedArea(null);
    }
  }, [selectedState, selectedCountry]);

  // Cascade: Zone change → fetch areas, reset area
  useEffect(() => {
    if (selectedZone) {
      fetchAreasByZone(selectedZone._id);
      setSelectedArea(null);
      setFilterLevel("zone");
    } else if (selectedState) {
      setAreas([]);
      setSelectedArea(null);
      setFilterLevel("state");
    }
  }, [selectedZone, selectedState]);

  // Update filter level based on area selection
  useEffect(() => {
    if (selectedArea) {
      setFilterLevel("area");
    } else if (selectedZone) {
      setFilterLevel("zone");
    }
  }, [selectedArea]);

  const fetchZonesByCountryState = async (countryName: string, stateName: string) => {
    try {
      console.log("Fetching zones for:", { countryName, stateName });
      const response = await api.get(`/zones?countryId=${encodeURIComponent(countryName)}&stateId=${encodeURIComponent(stateName)}`);
      console.log("Zones API response:", response.data);

      if (response.data.success) {
        const zonesData = response.data.data?.zones || [];
        console.log("Zones data:", zonesData);
        setZones(Array.isArray(zonesData) ? zonesData : []);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      setZones([]);
    }
  };

  const fetchAreasByZone = async (zoneId: string) => {
    try {
      const response = await api.get(`/zones/${zoneId}/areas`);
      if (response.data.success) {
        const areasData = response.data.data?.areas || [];
        setAreas(Array.isArray(areasData) ? areasData : []);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
      setAreas([]);
    }
  };

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
      const params: any = {};

      // Country and State level filtering
      if (selectedCountry && filterLevel === "country") {
        params.country = selectedCountry.name;
      }
      if (selectedState && (filterLevel === "state" || filterLevel === "zone" || filterLevel === "area")) {
        params.state = selectedState.name;
      }

      // Zone and Area level filtering
      if (filterLevel === "zone" && selectedZone) params.zoneId = selectedZone._id;
      if (filterLevel === "area" && selectedArea) params.areaId = selectedArea._id;

      console.log("📊 Fetching BizWin Overview with params:", { filterLevel, params });

      const response = await api.get("/record/", { params });
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
      const params: any = {};

      // Country and State level filtering
      if (selectedCountry && filterLevel === "country") {
        params.country = selectedCountry.name;
      }
      if (selectedState && (filterLevel === "state" || filterLevel === "zone" || filterLevel === "area")) {
        params.state = selectedState.name;
      }

      // Zone and Area level filtering
      if (filterLevel === "zone" && selectedZone) params.zoneId = selectedZone._id;
      if (filterLevel === "area" && selectedArea) params.areaId = selectedArea._id;

      console.log("📊 Fetching BizConnect Overview with params:", { filterLevel, params });

      const [allTimeRes, last15DaysRes] = await Promise.all([
        api.get("/meetup/all-time-count", { params }),
        api.get("/meetup/meeting-count", { params }),
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
      const params: any = {};

      // Country and State level filtering
      if (selectedCountry && filterLevel === "country") {
        params.country = selectedCountry.name;
      }
      if (selectedState && (filterLevel === "state" || filterLevel === "zone" || filterLevel === "area")) {
        params.state = selectedState.name;
      }

      // Zone and Area level filtering
      if (filterLevel === "zone" && selectedZone) params.zoneId = selectedZone._id;
      if (filterLevel === "area" && selectedArea) params.areaId = selectedArea._id;

      console.log("📊 Fetching Referral Overview with params:", { filterLevel, params });

      const response = await api.get("/referrals", { params });

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

  const handleClearFilters = () => {
    setSelectedCountry(null);
    setSelectedState(null);
    setSelectedZone(null);
    setSelectedArea(null);
    setZones([]);
    setAreas([]);
    setFilterLevel("platform");
  };

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

      {/* Hierarchical Filters */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Filter size={24} color="#3b82f6" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
              Filter Data by Hierarchy
            </Typography>
            {filterLevel !== "platform" && (
              <Chip
                label={`Filter: ${filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)} Level`}
                color="primary"
                size="small"
                onDelete={handleClearFilters}
                sx={{ ml: "auto" }}
              />
            )}
          </Box>

          <Grid container spacing={2}>
            {/* Row 1: Country, State, Zone */}
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={countries}
                getOptionLabel={(option) => option.name}
                value={selectedCountry}
                onChange={(_, newValue) => setSelectedCountry(newValue)}
                isOptionEqualToValue={(option, value) => option.isoCode === value.isoCode}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    placeholder="Select Country"
                    size="small"
                  />
                )}
                sx={{ bgcolor: "white" }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={states}
                getOptionLabel={(option) => option.name}
                value={selectedState}
                onChange={(_, newValue) => setSelectedState(newValue)}
                disabled={!selectedCountry}
                isOptionEqualToValue={(option, value) => option.isoCode === value.isoCode}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="State"
                    placeholder={selectedCountry ? "Select State" : "Select country first"}
                    size="small"
                  />
                )}
                sx={{ bgcolor: selectedCountry ? "white" : "#f8fafc" }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={zones || []}
                getOptionLabel={(option) => option.zoneName}
                value={selectedZone}
                onChange={(_, newValue) => setSelectedZone(newValue)}
                disabled={!selectedState}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Zone (City)"
                    placeholder={selectedState ? "Select Zone" : "Select state first"}
                    size="small"
                  />
                )}
                sx={{ bgcolor: selectedState ? "white" : "#f8fafc" }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Autocomplete
                options={areas || []}
                getOptionLabel={(option) => option.areaName}
                value={selectedArea}
                onChange={(_, newValue) => setSelectedArea(newValue)}
                disabled={!selectedZone}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Area"
                    placeholder={selectedZone ? "Select Area" : "Select zone first"}
                    size="small"
                  />
                )}
                sx={{ bgcolor: selectedZone ? "white" : "#f8fafc" }}
              />
            </Grid>

            {/* Row 2: Filter Status Display */}
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#eff6ff",
                  borderRadius: 2,
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Filter size={16} color="#1e40af" />
                <Typography variant="body2" sx={{ color: "#1e40af", fontWeight: 500 }}>
                  {filterLevel === "platform" && "Showing platform-wide data"}
                  {filterLevel === "country" && `Showing data for ${selectedCountry?.name}`}
                  {filterLevel === "state" && `Showing data for ${selectedState?.name}, ${selectedCountry?.name}`}
                  {filterLevel === "zone" && `Showing data for ${selectedZone?.zoneName} (${selectedZone?.cityId}), ${selectedState?.name}`}
                  {filterLevel === "area" && `Showing data for ${selectedArea?.areaName} → ${selectedZone?.zoneName} → ${selectedState?.name} → ${selectedCountry?.name}`}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
          <Tab label="BizConnect (Referrals)" />
          <Tab label="Meetups Analytics" />
          <Tab label="Invite Analytics" />
        </Tabs>

        <CardContent sx={{ p: 0 }}>
          {activeTab === 0 && (
            <Box>
              <BizWinAnalytics
                filterLevel={filterLevel}
                selectedCountry={selectedCountry}
                selectedState={selectedState}
                selectedZone={selectedZone}
                selectedArea={selectedArea}
              />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <ReferralAnalytics
                filterLevel={filterLevel}
                selectedZone={selectedZone}
                selectedArea={selectedArea}
              />
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <BizConnectAnalytics
                filterLevel={filterLevel}
                selectedZone={selectedZone}
                selectedArea={selectedArea}
              />
            </Box>
          )}

          {activeTab === 3 && (
            <Box>
              <InviteAnalytics
                filterLevel={filterLevel}
                selectedZone={selectedZone}
                selectedArea={selectedArea}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
