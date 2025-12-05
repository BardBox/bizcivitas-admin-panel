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
import {
  Download,
  Search,
  Trash2,
} from "lucide-react";
import api from "../../api/api";
import { toast } from "react-toastify";
import { Country, State } from "country-state-city";

interface TYFCBRecord {
  _id: string;
  from: {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    membershipType?: string;
    business?: string;
    businessSubcategory?: string;
    city?: string;
    country?: string;
    state?: string;
    profile?: {
      professionalDetails?: {
        companyName?: string;
        city?: string;
        state?: string;
        country?: string;
        businessArea?: string;
        businessPincode?: string | number;
      };
    };
  };
  to: {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    membershipType?: string;
    business?: string;
    businessSubcategory?: string;
    city?: string;
    country?: string;
    state?: string;
    profile?: {
      professionalDetails?: {
        companyName?: string;
        city?: string;
        state?: string;
        country?: string;
        businessArea?: string;
        businessPincode?: string | number;
      };
    };
  };
  amount: number;
  comments?: string;
  createdAt: string;
}

type DateFilterType = "15days" | "3months" | "6months" | "tilldate";

interface BizWinAnalyticsProps {
  filterLevel?: "platform" | "country" | "state" | "zone" | "area";
  selectedCountry?: { name: string; isoCode: string } | null;
  selectedState?: { name: string; isoCode: string } | null;
  selectedZone?: { _id: string; zoneName: string } | null;
  selectedArea?: { _id: string; areaName: string } | null;
}

export default function BizWinAnalytics({
  filterLevel = "platform",
  selectedCountry = null,
  selectedState = null,
  selectedZone = null,
  selectedArea = null,
}: BizWinAnalyticsProps = {}) {
  const [records, setRecords] = useState<TYFCBRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<TYFCBRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [pincodeFilter, setPincodeFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("3months");

  const [countries, setCountries] = useState<
    { isoCode: string; name: string }[]
  >([]);
  const [states, setStates] = useState<{ isoCode: string; name: string }[]>([]);
  const [allBusinessCities, setAllBusinessCities] = useState<string[]>([]); // All cities from business data
  const [cities, setCities] = useState<string[]>([]); // Filtered cities based on country/state
  const [areas, setAreas] = useState<string[]>([]);
  const [pincodes, setPincodes] = useState<string[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Map to store which cities belong to which country/state (from actual business data)
  const [countryCityMap, setCountryCityMap] = useState<
    Map<string, Set<string>>
  >(new Map());
  const [stateCityMap, setStateCityMap] = useState<Map<string, Set<string>>>(
    new Map()
  );

  // Map userId to city for quick lookup
  const [userCityMap, setUserCityMap] = useState<Map<string, string>>(
    new Map()
  );
  // Map userId to company name for quick lookup
  const [userCompanyMap, setUserCompanyMap] = useState<Map<string, string>>(
    new Map()
  );
  // Map userId to membership type for quick lookup
  const [userMembershipMap, setUserMembershipMap] = useState<
    Map<string, string>
  >(new Map());
  // Map userId to country for quick lookup
  const [userCountryMap, setUserCountryMap] = useState<Map<string, string>>(
    new Map()
  );
  // Map userId to state for quick lookup
  const [userStateMap, setUserStateMap] = useState<Map<string, string>>(
    new Map()
  );

  useEffect(() => {
    fetchAllRecords();
    fetchAllCitiesAndMemberships();
  }, [filterLevel, selectedCountry, selectedState, selectedZone, selectedArea]);

  useEffect(() => {
    applyFilters();
  }, [
    records,
    searchQuery,
    countryFilter,
    stateFilter,
    cityFilter,
    areaFilter,
    pincodeFilter,
    membershipFilter,
    dateFilter,
    selectedZone,
    selectedArea,
    filterLevel,
  ]);

  // Load countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries().map((country) => ({
      isoCode: country.isoCode,
      name: country.name,
    }));
    setCountries(allCountries);
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (countryFilter === "all") {
      setStates([]);
      setStateFilter("all");
      // Show all business cities when no country selected
      setCities(allBusinessCities);
    } else {
      const countryStates = State.getStatesOfCountry(countryFilter).map(
        (state) => ({
          isoCode: state.isoCode,
          name: state.name,
        })
      );
      setStates(countryStates);
      setStateFilter("all");
    }
  }, [countryFilter, allBusinessCities]);

  // Filter cities when country/state changes - using actual business data
  useEffect(() => {
    setCityFilter("all");

    if (countryFilter === "all") {
      // No country filter: show all business cities
      setCities(allBusinessCities);
    } else {
      // Get the selected country name
      const selectedCountry = countries.find(
        (c) => c.isoCode === countryFilter
      );
      if (!selectedCountry) {
        setCities(allBusinessCities);
        return;
      }

      if (stateFilter === "all") {
        // Country selected, no state: show cities from that country in our ACTUAL business data
        const citiesInCountry = countryCityMap.get(selectedCountry.name);
        if (citiesInCountry && citiesInCountry.size > 0) {
          setCities(Array.from(citiesInCountry).sort());
        } else {
          // No cities found for this country in our data
          setCities([]);
        }
      } else {
        // Both country and state selected: show cities from that state in our ACTUAL business data
        const selectedState = states.find((s) => s.isoCode === stateFilter);
        if (selectedState) {
          const stateKey = `${selectedCountry.name}::${selectedState.name}`;
          const citiesInState = stateCityMap.get(stateKey);
          if (citiesInState && citiesInState.size > 0) {
            setCities(Array.from(citiesInState).sort());
          } else {
            // No cities found for this state in our data
            setCities([]);
          }
        } else {
          setCities([]);
        }
      }
    }
  }, [
    countryFilter,
    stateFilter,
    allBusinessCities,
    countryCityMap,
    stateCityMap,
    countries,
    states,
  ]);

  const fetchAllRecords = async () => {
    setLoading(true);
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

      console.log("🔍 BizWin Fetching with params:", { filterLevel, params, selectedCountry, selectedState, selectedZone, selectedArea });

      const response = await api.get("/record/", { params });
      if (response.data.success) {
        const data = response.data.data;
        setRecords(data);

        // Fallback: Extract cities from records if user API failed
        if (allBusinessCities.length === 0) {
          extractCitiesFromRecords(data);
        }
      }
    } catch (error: any) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load BizWin data");
    } finally {
      setLoading(false);
    }
  };

  const extractCitiesFromRecords = (data: TYFCBRecord[]) => {
    const uniqueCities = new Set<string>();
    const uniqueMembershipTypes = new Set<string>();

    data.forEach((record: TYFCBRecord) => {
      // Extract cities
      const fromCity =
        record.from?.profile?.professionalDetails?.city || record.from?.city;
      const toCity =
        record.to?.profile?.professionalDetails?.city || record.to?.city;

      if (fromCity && fromCity !== "N/A") uniqueCities.add(fromCity);
      if (toCity && toCity !== "N/A") uniqueCities.add(toCity);

      // Extract memberships
      const fromMembership = record.from?.membershipType;
      const toMembership = record.to?.membershipType;
      if (fromMembership && fromMembership !== "N/A")
        uniqueMembershipTypes.add(fromMembership);
      if (toMembership && toMembership !== "N/A")
        uniqueMembershipTypes.add(toMembership);
    });

    console.log(
      "Fallback: Extracted cities from records:",
      Array.from(uniqueCities)
    );
    const sortedCities = Array.from(uniqueCities).sort();
    setAllBusinessCities(sortedCities); // Store all business cities
    setCities(sortedCities); // Initially show all
    setMembershipTypes(Array.from(uniqueMembershipTypes).sort());
  };

  const fetchAllCitiesAndMemberships = async () => {
    try {
      const response = await api.get("/users/getallusers");

      if (response.data.success && response.data.data?.users) {
        const users = response.data.data.users;

        const uniqueCities = new Set<string>();
        const uniqueAreas = new Set<string>();
        const uniquePincodes = new Set<string>();
        const uniqueMembershipTypes = new Set<string>();
        const cityMap = new Map<string, string>();
        const companyMap = new Map<string, string>();
        const membershipMap = new Map<string, string>();
        const countryMap = new Map<string, string>();
        const stateMap = new Map<string, string>();
        const countryCities = new Map<string, Set<string>>();
        const stateCities = new Map<string, Set<string>>();

        users.forEach((item: any, index: number) => {
          const user = item.user;

          // Extract business city from professionalDetails (with fallback to addresses.address)
          const city =
            user?.profile?.professionalDetails?.businessCity ||
            user?.profile?.addresses?.address?.city ||
            user?.city;
          if (city && city !== "N/A" && city.trim() !== "") {
            uniqueCities.add(city);
          }

          // Extract company name from professionalDetails
          const companyName =
            user?.profile?.professionalDetails?.companyName ||
            user?.companyName;

          // Extract membership type
          const membership = user?.membershipType;
          if (membership && membership !== "N/A" && membership.trim() !== "") {
            uniqueMembershipTypes.add(membership);
          }

          // Extract business area
          const area = user?.profile?.professionalDetails?.businessArea;
          if (area && area !== "N/A" && area.trim() !== "") {
            uniqueAreas.add(area);
          }

          // Extract business pincode
          const pincode = user?.profile?.professionalDetails?.businessPincode;
          if (pincode && String(pincode) !== "N/A" && String(pincode).trim() !== "") {
            uniquePincodes.add(String(pincode));
          }

          // Extract business country from professionalDetails (with fallback to addresses.address)
          const country =
            user?.profile?.professionalDetails?.businessCountry ||
            user?.profile?.addresses?.address?.country;

          // Extract business state from professionalDetails (with fallback to addresses.address)
          const state =
            user?.profile?.professionalDetails?.businessState ||
            user?.profile?.addresses?.address?.state;

          // Debug: Log first 3 users with city data to see country/state
          if (index < 3 && city) {
            console.log(`User ${index}:`, {
              city,
              country,
              state,
              hasProfile: !!user?.profile,
              hasProfessionalDetails: !!user?.profile?.professionalDetails,
              professionalDetails: user?.profile?.professionalDetails,
            });
          }

          // Build country-city and state-city mappings from actual data
          if (
            country &&
            country !== "N/A" &&
            city &&
            city !== "N/A" &&
            city.trim() !== ""
          ) {
            if (!countryCities.has(country)) {
              countryCities.set(country, new Set());
            }
            countryCities.get(country)!.add(city);
          }

          if (
            state &&
            state !== "N/A" &&
            city &&
            city !== "N/A" &&
            city.trim() !== ""
          ) {
            const stateKey = `${country}::${state}`; // Prefix with country to avoid state name conflicts
            if (!stateCities.has(stateKey)) {
              stateCities.set(stateKey, new Set());
            }
            stateCities.get(stateKey)!.add(city);
          }

          // Map userId to city, company, membership, country, and state for quick lookup
          // Use _id as the key since BizWin records reference user by _id, not userId
          const userIdKey = user?._id || user?.userId;

          if (userIdKey) {
            cityMap.set(userIdKey, city || "N/A");
            companyMap.set(userIdKey, companyName || "N/A");
            membershipMap.set(userIdKey, membership || "N/A");
            countryMap.set(userIdKey, country || "N/A");
            stateMap.set(userIdKey, state || "N/A");
          }
        });

        // Extract unique countries and states for debugging
        const uniqueCountries = new Set<string>();
        const uniqueStates = new Set<string>();
        countryMap.forEach((country) => {
          if (country && country !== "N/A") uniqueCountries.add(country);
        });
        stateMap.forEach((state) => {
          if (state && state !== "N/A") uniqueStates.add(state);
        });

        console.log(
          "Extracted cities from all users:",
          Array.from(uniqueCities)
        );
        console.log(
          "Extracted countries from all users:",
          Array.from(uniqueCountries)
        );
        console.log(
          "Extracted states from all users:",
          Array.from(uniqueStates)
        );
        console.log(
          "Extracted membership types from all users:",
          Array.from(uniqueMembershipTypes)
        );
        console.log("📍 Created user city map with", cityMap.size, "entries");
        console.log(
          "🏢 Created user company map with",
          companyMap.size,
          "entries"
        );
        console.log(
          "🎫 Created user membership map with",
          membershipMap.size,
          "entries"
        );
        console.log(
          "🌍 Created user country map with",
          countryMap.size,
          "entries"
        );
        console.log("🏛️ Created user state map with", stateMap.size, "entries");
        console.log(
          "🗺️ Created country-city map with",
          countryCities.size,
          "countries"
        );
        console.log(
          "🏛️ Created state-city map with",
          stateCities.size,
          "states"
        );

        if (countryCities.size === 0) {
          console.warn(
            "⚠️ WARNING: No country-city mappings found! Users may not have businessCountry filled in professionalDetails"
          );
        } else {
          // Debug: Show what cities each country has
          console.log("📍 Country-City Mappings:");
          countryCities.forEach((cities, country) => {
            console.log(`  ${country}: ${Array.from(cities).join(", ")}`);
          });
        }

        const sortedCities = Array.from(uniqueCities).sort();
        setAllBusinessCities(sortedCities); // Store all business cities
        setCities(sortedCities); // Initially show all
        setAreas(Array.from(uniqueAreas).sort());
        setPincodes(Array.from(uniquePincodes).sort());
        setMembershipTypes(Array.from(uniqueMembershipTypes).sort());
        setUserCityMap(cityMap);
        setUserCompanyMap(companyMap);
        setUserMembershipMap(membershipMap);
        setUserCountryMap(countryMap);
        setUserStateMap(stateMap);
        setCountryCityMap(countryCities);
        setStateCityMap(stateCities);
      } else {
        console.warn("Unexpected response structure:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching cities and memberships:", error);
      console.error("Error details:", error.response?.data);
      // Don't show error toast - just log it
      // Fall back to extracting from records
      console.log("Falling back to extracting cities from BizWin records");
    }
  };

  const getDateRange = (filter: DateFilterType) => {
    const now = new Date();
    // Set end date to end of today (23:59:59.999)
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    let startDate: Date;

    switch (filter) {
      case "15days":
        startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of day
        break;
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of day
        break;
      case "6months":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of day
        break;
      case "tilldate":
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0); // Start of day
    }

    return { startDate, endDate };
  };

  const applyFilters = () => {
    let filtered = [...records];

    // Date filter
    const { startDate, endDate } = getDateRange(dateFilter);
    filtered = filtered.filter((record) => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Country filter - use business country from professionalDetails
    if (countryFilter !== "all") {
      const selectedCountry = countries.find(
        (c) => c.isoCode === countryFilter
      );
      if (selectedCountry) {
        filtered = filtered.filter((record) => {
          const fromCountry = getCountryForUser(record.from?._id);
          const toCountry = getCountryForUser(record.to?._id);
          // Match against country name
          return (
            fromCountry === selectedCountry.name ||
            toCountry === selectedCountry.name
          );
        });
      }
    }

    // State filter - use business state from professionalDetails
    if (stateFilter !== "all") {
      const selectedState = states.find((s) => s.isoCode === stateFilter);
      if (selectedState) {
        filtered = filtered.filter((record) => {
          const fromState = getStateForUser(record.from?._id);
          const toState = getStateForUser(record.to?._id);
          // Match against state name
          return (
            fromState === selectedState.name || toState === selectedState.name
          );
        });
      }
    }

    // City filter - use our city map lookup
    if (cityFilter !== "all") {
      filtered = filtered.filter((record) => {
        const fromCity = getCityForUser(record.from?._id);
        const toCity = getCityForUser(record.to?._id);
        return fromCity === cityFilter || toCity === cityFilter;
      });
    }

    // Area filter
    if (areaFilter !== "all") {
      filtered = filtered.filter((record) => {
        const fromArea = record.from.profile?.professionalDetails?.businessArea;
        const toArea = record.to.profile?.professionalDetails?.businessArea;
        return fromArea === areaFilter || toArea === areaFilter;
      });
    }

    // Pincode filter
    if (pincodeFilter !== "all") {
      filtered = filtered.filter((record) => {
        const fromPincode = String(record.from.profile?.professionalDetails?.businessPincode || "");
        const toPincode = String(record.to.profile?.professionalDetails?.businessPincode || "");
        return fromPincode === pincodeFilter || toPincode === pincodeFilter;
      });
    }

    // Membership filter
    if (membershipFilter !== "all") {
      filtered = filtered.filter(
        (record) =>
          record.from?.membershipType === membershipFilter ||
          record.to?.membershipType === membershipFilter
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (record) =>
          `${record.from?.fname} ${record.from?.lname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          `${record.to?.fname} ${record.to?.lname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.from?.email
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.to?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.from?.profile?.professionalDetails?.companyName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          record.to?.profile?.professionalDetails?.companyName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredRecords(filtered);
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (!value || value === 0) return `₹0`;
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
    return `₹${value.toLocaleString()}`;
  };

  // Helper function to get city for a user
  const getCityForUser = (userId: string | undefined): string => {
    if (!userId) return "N/A";
    const city = userCityMap.get(userId);
    return city && city !== "N/A" && city.trim() !== "" ? city : "N/A";
  };

  // Helper function to get company name for a user
  const getCompanyForUser = (userId: string | undefined): string => {
    if (!userId) return "N/A";
    const company = userCompanyMap.get(userId);
    return company && company !== "N/A" && company.trim() !== ""
      ? company
      : "N/A";
  };

  // Helper function to get membership for a user (abbreviated)
  const getMembershipForUser = (userId: string | undefined): string => {
    if (!userId) return "N/A";
    const membership = userMembershipMap.get(userId);
    if (!membership || membership === "N/A" || membership.trim() === "") {
      return "N/A";
    }
    // Remove "Membership" word to shorten the label
    return membership.replace(" Membership", "").trim();
  };

  // Helper function to get country for a user
  const getCountryForUser = (userId: string | undefined): string => {
    if (!userId) return "N/A";
    const country = userCountryMap.get(userId);
    return country && country !== "N/A" && country.trim() !== ""
      ? country
      : "N/A";
  };

  // Helper function to get state for a user
  const getStateForUser = (userId: string | undefined): string => {
    if (!userId) return "N/A";
    const state = userStateMap.get(userId);
    return state && state !== "N/A" && state.trim() !== "" ? state : "N/A";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRecords.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, recordId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== recordId));
    }
  };

  const handleDelete = async (recordId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this BizWin record? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/record/${recordId}`);
      if (response.data.success) {
        toast.success("Record deleted successfully!");
        // Remove from state
        setRecords(records.filter((r) => r._id !== recordId));
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete record");
    }
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} records? This action cannot be undone.`
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    try {
      // Delete all selected records in parallel
      await Promise.all(selectedIds.map((id) => api.delete(`/record/${id}`)));

      toast.success(`${selectedIds.length} records deleted successfully!`);
      // Remove from state
      setRecords(records.filter((r) => !selectedIds.includes(r._id)));
      setSelectedIds([]);
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete some records");
    } finally {
      setBulkDeleting(false);
    }
  };

  const downloadCSV = () => {
    const headers = [
      "Date",
      "From User",
      "From Company",
      "From City",
      "From Membership",
      "To User",
      "To Company",
      "To City",
      "To Membership",
      "Amount (₹)",
      "Comments",
    ];

    const rows = filteredRecords.map((record) => [
      new Date(record.createdAt).toLocaleDateString(),
      `${record.from?.fname} ${record.from?.lname}`,
      getCompanyForUser(record.from?._id), // Use company lookup
      getCityForUser(record.from?._id), // Use city lookup
      getMembershipForUser(record.from?._id), // Use membership lookup
      `${record.to?.fname} ${record.to?.lname}`,
      getCompanyForUser(record.to?._id), // Use company lookup
      getCityForUser(record.to?._id), // Use city lookup
      getMembershipForUser(record.to?._id), // Use membership lookup
      record.amount,
      record.comments || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bizwin-analytics-${new Date().toISOString().split("T")[0]
      }.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded successfully!");
  };



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
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}
        >
          BizWin Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Detailed platform-wide revenue and business transaction analysis
        </Typography>
      </Box>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            bgcolor: "#fef3c7",
            border: "2px solid #f59e0b",
          }}
        >
          <CardContent sx={{ py: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontWeight: 600, color: "#92400e" }}>
                {selectedIds.length} record{selectedIds.length > 1 ? "s" : ""}{" "}
                selected
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                style={{ display: "none" }}
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `Delete Selected (${selectedIds.length})`}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {/* First Row */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Name, email, company..."
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
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Country"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <MenuItem value="all">All Countries</MenuItem>
                {countries.map((country) => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="State"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                disabled={countryFilter === "all"}
              >
                <MenuItem value="all">All States</MenuItem>
                {states.map((state) => (
                  <MenuItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="City"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                <MenuItem value="all">All Cities</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Area"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <MenuItem value="all">All Areas</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                select
                label="Pincode"
                value={pincodeFilter}
                onChange={(e) => setPincodeFilter(e.target.value)}
              >
                <MenuItem value="all">All Pincodes</MenuItem>
                {pincodes.map((pincode) => (
                  <MenuItem key={pincode} value={pincode}>
                    {pincode}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Second Row */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Membership"
                value={membershipFilter}
                onChange={(e) => setMembershipFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                {membershipTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label="Date Range"
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(e.target.value as DateFilterType)
                }
              >
                <MenuItem value="15days">Last 15 Days</MenuItem>
                <MenuItem value="3months">Last 3 Months</MenuItem>
                <MenuItem value="6months">Last 6 Months</MenuItem>
                <MenuItem value="tilldate">Till Date</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Download />}
                onClick={downloadCSV}
                sx={{
                  height: "56px",
                  bgcolor: "#10b981",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 3 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={
                      selectedIds.length === filteredRecords.length &&
                      filteredRecords.length > 0
                    }
                    indeterminate={
                      selectedIds.length > 0 &&
                      selectedIds.length < filteredRecords.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>From</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>To</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Membership</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography color="textSecondary">
                      No records found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => {
                  // Get city, company, and membership from our user maps
                  const fromCity = getCityForUser(record.from?._id);
                  const fromCompany = getCompanyForUser(record.from?._id);
                  const fromMembership = getMembershipForUser(record.from?._id);
                  const toCompany = getCompanyForUser(record.to?._id);
                  const toMembership = getMembershipForUser(record.to?._id);

                  return (
                    <TableRow
                      key={record._id}
                      hover
                      selected={selectedIds.includes(record._id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(record._id)}
                          onChange={(e) =>
                            handleSelectOne(record._id, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {record.from?.fname} {record.from?.lname}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            {fromCompany}
                          </Typography>
                          {fromMembership !== "N/A" && (
                            <Chip
                              label={fromMembership}
                              size="small"
                              sx={{
                                height: "18px",
                                fontSize: "0.65rem",
                                bgcolor: "#fef3c7",
                                color: "#92400e",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {record.to?.fname} {record.to?.lname}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="caption" color="textSecondary">
                            {toCompany}
                          </Typography>
                          {toMembership !== "N/A" && (
                            <Chip
                              label={toMembership}
                              size="small"
                              sx={{
                                height: "18px",
                                fontSize: "0.65rem",
                                bgcolor: "#fef3c7",
                                color: "#92400e",
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 700, color: "#10b981" }}
                        >
                          {formatCurrency(record.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fromCity}
                          size="small"
                          sx={{ bgcolor: "#e0f2fe", color: "#0369a1" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.from?.membershipType || "N/A"}
                          size="small"
                          sx={{ bgcolor: "#fef3c7", color: "#92400e" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="textSecondary">
                          {record.comments || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<Trash2 size={16} />}
                          onClick={() => handleDelete(record._id)}
                          sx={{ minWidth: "90px", display: "none" }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
