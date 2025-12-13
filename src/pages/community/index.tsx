import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVisibility } from "../../context/VisibilityContext";
import api from "../../api/api";
import { AxiosError, AxiosResponse } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Grid,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";
import { Add, Edit, Delete, Check } from "@mui/icons-material";
import { Country, State, City } from "country-state-city";
import {
  validateLocationData,
  getLocationFieldLabels,
} from "../../utils/locationUtils";

interface LocationFieldVisibility {
  showCountry: boolean;
  showState: boolean;
  showCity: boolean;
  showCommunity: boolean;
  disableState: boolean;
  disableCity: boolean;
  disableCommunity: boolean;
  showStateField: boolean;
  showCityField: boolean;
}

interface CoreGroup {
  _id: string;
  name: string;
  coreMembers: { _id: string; fname: string; lname: string }[];
  countries: string[];
  states: string[];
  cities: string[];
  cgc?: { _id: string; fname: string; lname: string }[] | null; // ✅ Multiple CGCs (Core Group Captains)
  cgcPositions?: {
    president?: string;
    networkingDirector?: string;
    membershipDirector?: string;
  };
}

interface Community {
  _id: string;
  communityName: string;
  image: string;
  coreGroup: { _id: string; name: string } | null;
  coreMembers: { id: string; name: string }[];
  countries: string[];
  states: string[];
  cities: string[];
  communityType: string | string[];
  cgc?: { _id: string; fname: string; lname: string }[] | null; // ✅ Multiple CGCs for community
  cgcPositions?: {
    president?: string;
    networkingDirector?: string;
    membershipDirector?: string;
  };
}

interface Member {
  _id: string;
  fname: string;
  lname: string;
}

interface CGCPositionAssignment {
  memberId: string;
  position: string;
}

const CGC_POSITIONS = [
  { value: "president", label: "President" },
  { value: "networkingDirector", label: "Networking Director" },
  { value: "membershipDirector", label: "Membership Director" },
];

export const communityTypes = ["Flagship Membership", "Industria Membership"];

const CommunityPage: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tabValue, setTabValue] = useState(0);
  const [coreGroups, setCoreGroups] = useState<CoreGroup[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [coreMembers, setCoreMembers] = useState<Member[]>([]);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode:
      | "createCoreGroup"
      | "editCoreGroup"
      | "deleteCoreGroup"
      | "createCommunity"
      | "editCommunity"
      | "deleteCommunity"
      | null;
    coreGroupId?: string;
    communityId?: string;
  }>({ open: false, mode: null });
  const [coreGroupForm, setCoreGroupForm] = useState<{
    name: string;
    coreMemberIds: string[];
    countries: string[];
    states: string[];
    cities: string[];
    cgcIds: string[]; // ✅ Multiple CGCs assignment
  }>({ name: "", coreMemberIds: [], countries: [], states: [], cities: [], cgcIds: [] });
  const [communityForm, setCommunityForm] = useState<{
    communityName: string;
    coreGroupId: string;
    coreMemberIds: string[];
    countries: string[];
    states: string[];
    cities: string[];
    communityType: string[];
    image: File | null;
    cgcIds: string[]; // ✅ Multiple CGCs assignment
  }>({
    communityName: "",
    coreGroupId: "",
    coreMemberIds: [],
    countries: [],
    states: [],
    cities: [],
    communityType: [],
    image: null,
    cgcIds: [],
  });
  const [previewImage, setPreviewImage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [filteredCoreMembers, setFilteredCoreMembers] = useState<Member[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCommunityCountry, setSelectedCommunityCountry] = useState("");
  const [selectedCommunityState, setSelectedCommunityState] = useState("");
  const [coreGroupCGCAssignments, setCoreGroupCGCAssignments] = useState<CGCPositionAssignment[]>([{ memberId: "", position: "" }]);
  const [communityCGCAssignments, setCommunityCGCAssignments] = useState<CGCPositionAssignment[]>([{ memberId: "", position: "" }]);

  useEffect(() => {
    fetchCoreGroups();
    fetchCommunities();
    fetchCoreMembers();
  }, []);

  const getLocationFieldVisibility = (countries: string[], stateValue: string): LocationFieldVisibility => {
    return {
      showCountry: true,
      showState: countries.length > 0,
      showCity: countries.length > 0 && stateValue !== "",
      showCommunity: false,
      disableState: countries.length === 0,
      disableCity: countries.length === 0 || stateValue === "",
      disableCommunity: true,
      showStateField: countries.length > 0,
      showCityField: countries.length > 0 && stateValue !== "",
    };
  };

  const fetchCoreGroups = async () => {
    try {
      console.log("🔵 [FETCH CORE GROUPS] Calling API endpoint: GET /coregroup");
      const response: AxiosResponse<{ data: CoreGroup[] }> = await api.get(
        "/coregroup"
      );
      console.log("✅ [FETCH CORE GROUPS] Response received:", response.data);
      console.log("📊 [FETCH CORE GROUPS] Total core groups:", response.data.data.length);
      setCoreGroups(response.data.data);
    } catch (error) {
      console.error("❌ [FETCH CORE GROUPS] Error fetching core groups:", error);
      toast.error("Failed to fetch core groups.");
    }
  };

  const fetchCommunities = async () => {
    try {
      console.log("🟢 [FETCH COMMUNITIES] Calling API endpoint: GET /community");
      const response: AxiosResponse<{ data: Community[] }> = await api.get(
        "/community"
      );
      console.log("✅ [FETCH COMMUNITIES] Response received:", response.data);
      console.log("📊 [FETCH COMMUNITIES] Total communities:", response.data.data.length);
      const normalizedCommunities = response.data.data.map((community) => ({
        ...community,
        communityType: Array.isArray(community.communityType)
          ? community.communityType
          : community.communityType
          ? [community.communityType]
          : [],
      }));
      setCommunities(normalizedCommunities);
    } catch (error) {
      console.error("❌ [FETCH COMMUNITIES] Error fetching communities:", error);
      toast.error("Failed to fetch communities.");
    }
  };

  const fetchCoreMembers = async () => {
    try {
      console.log("🟡 [FETCH CORE MEMBERS] Calling API endpoint: GET /core-members");
      const response: AxiosResponse<{ data: Member[] }> = await api.get(
        "/core-members"
      );
      console.log("✅ [FETCH CORE MEMBERS] Response received:", response.data);
      console.log("📊 [FETCH CORE MEMBERS] Total core members:", response.data.data.length);
      setCoreMembers(response.data.data);
    } catch (error) {
      console.error("❌ [FETCH CORE MEMBERS] Error fetching core members:", error);
      toast.error("Failed to fetch core members.");
    }
  };

  const fetchCoreMembersByGroup = async (coreGroupId: string) => {
    if (!coreGroupId) {
      setFilteredCoreMembers([]);
      return;
    }
    try {
      const response: AxiosResponse<{ data: Member[] }> = await api.get(
        `/coregroup/${coreGroupId}/members`
      );
      setFilteredCoreMembers(response.data.data);
    } catch (error) {
      console.error("Error fetching core members by group:", error);
      toast.error("Failed to fetch core members for the selected group.");
      setFilteredCoreMembers([]);
    }
  };

  const fetchCoreGroupCGCPositions = async (groupId: string, coreMemberIds: string[]) => {
    try {
      const response = await api.get(`/coregroup/${groupId}/cgc-positions`);
      const existingPositions = response.data.data || {};

      const loadedAssignments: CGCPositionAssignment[] = [];
      if (existingPositions.president) {
        const presidentId = existingPositions.president._id || existingPositions.president;
        // Only add if this user is in the current core members list
        if (coreMemberIds.includes(presidentId)) {
          loadedAssignments.push({
            memberId: presidentId,
            position: "president",
          });
        }
      }
      if (existingPositions.networkingDirector) {
        const networkingDirectorId = existingPositions.networkingDirector._id || existingPositions.networkingDirector;
        if (coreMemberIds.includes(networkingDirectorId)) {
          loadedAssignments.push({
            memberId: networkingDirectorId,
            position: "networkingDirector",
          });
        }
      }
      if (existingPositions.membershipDirector) {
        const membershipDirectorId = existingPositions.membershipDirector._id || existingPositions.membershipDirector;
        if (coreMemberIds.includes(membershipDirectorId)) {
          loadedAssignments.push({
            memberId: membershipDirectorId,
            position: "membershipDirector",
          });
        }
      }

      setCoreGroupCGCAssignments(loadedAssignments.length > 0 ? loadedAssignments : [{ memberId: "", position: "" }]);
    } catch (error) {
      console.error("Error fetching CGC positions:", error);
      setCoreGroupCGCAssignments([{ memberId: "", position: "" }]);
    }
  };

  const fetchCommunityCGCPositions = async (communityId: string, coreMemberIds: string[]) => {
    try {
      const response = await api.get(`/community/${communityId}/cgc-positions`);
      const existingPositions = response.data.data || {};

      const loadedAssignments: CGCPositionAssignment[] = [];
      if (existingPositions.president) {
        const presidentId = existingPositions.president._id || existingPositions.president;
        // Only add if this user is in the current core members list
        if (coreMemberIds.includes(presidentId)) {
          loadedAssignments.push({
            memberId: presidentId,
            position: "president",
          });
        }
      }
      if (existingPositions.networkingDirector) {
        const networkingDirectorId = existingPositions.networkingDirector._id || existingPositions.networkingDirector;
        if (coreMemberIds.includes(networkingDirectorId)) {
          loadedAssignments.push({
            memberId: networkingDirectorId,
            position: "networkingDirector",
          });
        }
      }
      if (existingPositions.membershipDirector) {
        const membershipDirectorId = existingPositions.membershipDirector._id || existingPositions.membershipDirector;
        if (coreMemberIds.includes(membershipDirectorId)) {
          loadedAssignments.push({
            memberId: membershipDirectorId,
            position: "membershipDirector",
          });
        }
      }

      setCommunityCGCAssignments(loadedAssignments.length > 0 ? loadedAssignments : [{ memberId: "", position: "" }]);
    } catch (error) {
      console.error("Error fetching community CGC positions:", error);
      setCommunityCGCAssignments([{ memberId: "", position: "" }]);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openDialog = (
    mode:
      | "createCoreGroup"
      | "editCoreGroup"
      | "deleteCoreGroup"
      | "createCommunity"
      | "editCommunity"
      | "deleteCommunity",
    id?: string
  ) => {
    setDialog({
      open: true,
      mode,
      coreGroupId: mode.includes("CoreGroup") ? id : undefined,
      communityId: mode.includes("Community") ? id : undefined,
    });
    setErrors({});
    setPreviewImage("");
    if (mode === "createCoreGroup") {
      setCoreGroupForm({
        name: "",
        coreMemberIds: [],
        countries: [],
        states: [],
        cities: [],
        cgcIds: [], // ✅ Reset CGCs
      });
      setCoreGroupCGCAssignments([{ memberId: "", position: "" }]);
      setSelectedCountry("");
      setSelectedState("");
    } else if (mode === "editCoreGroup" && id) {
      const coreGroup = coreGroups.find((g) => g._id === id);
      if (coreGroup) {
        setCoreGroupForm({
          name: coreGroup.name,
          coreMemberIds: coreGroup.coreMembers.map((m) => m._id),
          countries: coreGroup.countries,
          states: coreGroup.states,
          cities: coreGroup.cities,
          cgcIds: coreGroup.cgc?.map(c => c._id) || [], // ✅ Set existing CGCs
        });
        setSelectedCountry(coreGroup.countries[0] || "");
        setSelectedState(coreGroup.states[0] || "");
        // Fetch existing CGC positions for this core group
        const coreMemberIds = coreGroup.coreMembers.map((m) => m._id);
        fetchCoreGroupCGCPositions(id, coreMemberIds);
      }
    } else if (mode === "createCommunity") {
      setCommunityForm({
        communityName: "",
        coreGroupId: "",
        coreMemberIds: [],
        countries: [],
        states: [],
        cities: [],
        communityType: [],
        image: null,
        cgcIds: [], // ✅ Reset CGCs
      });
      setCommunityCGCAssignments([{ memberId: "", position: "" }]);
      setFilteredCoreMembers([]);
      setSelectedCommunityCountry("");
      setSelectedCommunityState("");
    } else if (mode === "editCommunity" && id) {
      const community = communities.find((c) => c._id === id);
      console.log("🔵 [EDIT COMMUNITY] Community data:", community);
      if (community) {
        // Find the core group to get its members
        // Note: backend returns coreGroup with 'id' field, not '_id'
        const coreGroupId = (community.coreGroup as any)?.id || community.coreGroup?._id;
        const coreGroup = coreGroups.find(g => g._id === coreGroupId);
        console.log("🔵 [EDIT COMMUNITY] Core Group:", coreGroup);
        console.log("🔵 [EDIT COMMUNITY] Core Group ID from community:", coreGroupId);
        console.log("🔵 [EDIT COMMUNITY] Available Core Groups:", coreGroups);

        // Initialize filteredCoreMembers with the core group's members
        if (coreGroup) {
          console.log("🔵 [EDIT COMMUNITY] Setting filtered core members:", coreGroup.coreMembers);
          setFilteredCoreMembers(coreGroup.coreMembers);
        } else {
          console.warn("⚠️ [EDIT COMMUNITY] Core group not found in coreGroups array");
        }

        const memberIds = community.coreMembers.map((m) => m.id);
        console.log("🔵 [EDIT COMMUNITY] Core Member IDs:", memberIds);
        console.log("🔵 [EDIT COMMUNITY] Core Members:", community.coreMembers);

        setCommunityForm({
          communityName: community.communityName,
          coreGroupId: coreGroupId || "",
          coreMemberIds: memberIds,
          countries: community.countries,
          states: community.states,
          cities: community.cities,
          communityType: Array.isArray(community.communityType)
            ? community.communityType
            : community.communityType
            ? [community.communityType]
            : [],
          image: null,
          cgcIds: community.cgc?.map(c => c._id) || [], // ✅ Set existing CGCs
        });
        setPreviewImage(
          `${import.meta.env.VITE_API_BASE_URL}/image/${community.image}`
        );
        setSelectedCommunityCountry(community.countries[0] || "");
        setSelectedCommunityState(community.states[0] || "");
        // Fetch existing CGC positions for this community
        fetchCommunityCGCPositions(id, memberIds);
      }
    }
  };

  const handleCoreGroupSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!coreGroupForm.name) newErrors.name = "Name is required";
    if (!coreGroupForm.coreMemberIds?.length)
      newErrors.coreMemberIds = "At least one core member is required";

    // Use universal validation for location fields
    const locationValidation = validateLocationData({
      countries: coreGroupForm.countries,
      states: coreGroupForm.states,
      cities: coreGroupForm.cities,
    });
    if (!locationValidation.isValid) {
      Object.assign(newErrors, locationValidation.errors);
    }

    // Validate CGC position assignments
    const validAssignments = coreGroupCGCAssignments.filter(
      (a) => a.memberId !== "" && a.position !== ""
    );
    const memberIds = validAssignments.map((a) => a.memberId);
    const uniqueMemberIds = new Set(memberIds);
    if (memberIds.length !== uniqueMemberIds.size) {
      newErrors.cgcPositions = "Same member cannot be assigned to multiple positions";
    }
    const positions = validAssignments.map((a) => a.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      newErrors.cgcPositions = "Each position can only be assigned once";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: coreGroupForm.name,
        coreMemberIds: coreGroupForm.coreMemberIds,
        countries: coreGroupForm.countries,
        states: coreGroupForm.states,
        cities: coreGroupForm.cities,
        cgcIds: coreGroupForm.cgcIds.length > 0 ? coreGroupForm.cgcIds : undefined,
      };

      let savedGroupId = dialog.coreGroupId;

      if (dialog.mode === "createCoreGroup") {
        const response = await api.post("/coregroup/", payload, {
          headers: { "Content-Type": "application/json" },
        });
        savedGroupId = response.data.data.coreGroup._id;
        toast.success("Core Group created successfully.");
      } else if (dialog.mode === "editCoreGroup" && dialog.coreGroupId) {
        await api.put(`/coregroup/${dialog.coreGroupId}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Core Group updated successfully.");
      }

      // Save CGC positions if any valid assignments
      if (validAssignments.length > 0 && savedGroupId) {
        const cgcPositions: any = {
          president: "",
          networkingDirector: "",
          membershipDirector: "",
        };
        validAssignments.forEach((assignment) => {
          cgcPositions[assignment.position] = assignment.memberId;
        });
        await api.post(`/coregroup/${savedGroupId}/assign-cgc-positions`, {
          cgcPositions,
        });
      }

      setDialog({ open: false, mode: null });
      fetchCoreGroups();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message ||
        `Failed to ${
          dialog.mode === "createCoreGroup" ? "create" : "update"
        } core group.`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoreGroup = async () => {
    if (!dialog.coreGroupId) return;
    setLoading(true);
    try {
      await api.delete(`/coregroup/${dialog.coreGroupId}`);
      toast.success("Core Group deleted successfully.");
      setDialog({ open: false, mode: null });
      fetchCoreGroups();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || "Failed to delete core group.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunitySubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!communityForm.communityName)
      newErrors.communityName = "Community name is required";
    if (!communityForm.coreGroupId)
      newErrors.coreGroupId = "Core group is required";
    if (!communityForm.coreMemberIds.length)
      newErrors.coreMemberIds = "At least one core member is required";

    // Use universal validation for location fields
    const locationValidation = validateLocationData({
      countries: communityForm.countries,
      states: communityForm.states,
      cities: communityForm.cities,
    });
    if (!locationValidation.isValid) {
      Object.assign(newErrors, locationValidation.errors);
    }
    if (!communityForm.communityType.length)
      newErrors.communityType = "At least one community type is required";
    if (dialog.mode === "createCommunity" && !communityForm.image)
      newErrors.image = "Image is required";

    // Validate CGC position assignments
    const validAssignments = communityCGCAssignments.filter(
      (a) => a.memberId !== "" && a.position !== ""
    );
    const memberIds = validAssignments.map((a) => a.memberId);
    const uniqueMemberIds = new Set(memberIds);
    if (memberIds.length !== uniqueMemberIds.size) {
      newErrors.cgcPositions = "Same member cannot be assigned to multiple positions";
    }
    const positions = validAssignments.map((a) => a.position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      newErrors.cgcPositions = "Each position can only be assigned once";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("communityName", communityForm.communityName);
      formData.append("coreGroupId", communityForm.coreGroupId);
      formData.append(
        "communityType",
        JSON.stringify(communityForm.communityType)
      );
      communityForm.countries.forEach((country) =>
        formData.append("countries[]", country)
      );
      communityForm.states.forEach((state) =>
        formData.append("states[]", state)
      );
      communityForm.cities.forEach((city) => formData.append("cities[]", city));
      communityForm.coreMemberIds.forEach((id) =>
        formData.append("coreMemberIds[]", id)
      );
      if (communityForm.image) formData.append("image", communityForm.image);
      // ✅ Include multiple CGCs
      communityForm.cgcIds.forEach((cgcId) =>
        formData.append("cgcIds[]", cgcId)
      );

      let savedCommunityId = dialog.communityId;

      if (dialog.mode === "createCommunity") {
        const response = await api.post("/community", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        savedCommunityId = response.data.data._id;
        toast.success("Community created successfully.");
      } else if (dialog.mode === "editCommunity" && dialog.communityId) {
        await api.put(`/community/${dialog.communityId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Community updated successfully.");
      }

      // Save CGC positions if any valid assignments
      if (validAssignments.length > 0 && savedCommunityId) {
        const cgcPositions: any = {
          president: "",
          networkingDirector: "",
          membershipDirector: "",
        };
        validAssignments.forEach((assignment) => {
          cgcPositions[assignment.position] = assignment.memberId;
        });
        await api.post(`/community/${savedCommunityId}/assign-cgc-positions`, {
          cgcPositions,
        });
      }

      setDialog({ open: false, mode: null });
      fetchCommunities();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || "Failed to save community.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!dialog.communityId) return;
    setLoading(true);
    try {
      await api.delete(`/community/${dialog.communityId}`);
      toast.success("Community deleted successfully.");
      setDialog({ open: false, mode: null });
      fetchCommunities();
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const errorMessage =
        error.response?.data?.message || "Failed to delete community.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size exceeds 2MB. Please upload a smaller file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setCommunityForm((prev) => ({ ...prev, image: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setSidebarAndHeaderVisibility(!dialog.open);
  }, [dialog.open, setSidebarAndHeaderVisibility]);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <ToastContainer />
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            mb: 1
          }}
        >
          Community
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage core groups and communities, assign leaders (CGC), and organize members
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          '& .MuiTab-root': {
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'none',
            minWidth: 140,
          },
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        <Tab label="Core Groups" />
        <Tab label="Communities" />
      </Tabs>
      {tabValue === 0 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openDialog("createCoreGroup")}
            sx={{
              mb: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            Add Core Group
          </Button>
          <Grid container spacing={3}>
            {coreGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 3,
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.3s',
                  borderRadius: 2,
                }}>
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Group Name */}
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'primary.main',
                        borderBottom: '2px solid',
                        borderColor: 'primary.light',
                        pb: 1
                      }}
                    >
                      {group.name}
                    </Typography>

                    {/* CGC Badge - Multiple CGCs */}
                    {/* CGC Badge - Multiple CGCs */}
                    {group.cgc && group.cgc.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            mb: 1
                          }}
                        >
                          Leaders ({group.cgc.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
                          <Table size="small" aria-label="leaders table">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600, py: 1 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1 }}>Position</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {group.cgc.map((cgc) => {
                                 let position = "";
                                 if (group.cgcPositions) {
                                   if (group.cgcPositions.president === cgc._id) position = "President";
                                   else if (group.cgcPositions.networkingDirector === cgc._id) position = "Networking Director";
                                   else if (group.cgcPositions.membershipDirector === cgc._id) position = "Membership Director";
                                 }
                                return (
                                  <TableRow
                                    key={cgc._id}
                                  >
                                    <TableCell component="th" scope="row" sx={{ py: 1 }}>
                                      {cgc.fname} {cgc.lname}
                                    </TableCell>
                                    <TableCell sx={{ py: 1, color: position ? 'primary.main' : 'text.secondary' }}>
                                      {position || '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Location Info */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Location:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 0 }}>
                        {group.cities.join(", ")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 0 }}>
                        {group.states.join(", ")}, {group.countries.join(", ")}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Core Members */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Core Members ({group.coreMembers.length}):</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 2.5 }}>
                        {group.coreMembers
                          .map((m) => `${m.fname} ${m.lname}`)
                          .join(", ")}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={() => openDialog("editCoreGroup", group._id)}
                        color="primary"
                        size="small"
                        sx={{ '&:hover': { bgcolor: 'primary.light' } }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => openDialog("deleteCoreGroup", group._id)}
                        color="error"
                        size="small"
                        sx={{ '&:hover': { bgcolor: 'error.light' } }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      {tabValue === 1 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openDialog("createCommunity")}
            sx={{
              mb: 3,
              px: 3,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            Add Community
          </Button>
          <Grid container spacing={3}>
            {communities.map((community) => (
              <Grid item xs={12} sm={6} md={4} key={community._id}>
                <Card sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 3,
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.3s',
                  borderRadius: 2,
                }}>
                  {/* Community Image */}
                  {community.image && (
                    <Box
                      component="img"
                      src={`${import.meta.env.VITE_API_BASE_URL}/image/${community.image}`}
                      alt={community.communityName}
                      sx={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                      }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Community Name */}
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 600,
                        color: 'primary.main',
                        borderBottom: '2px solid',
                        borderColor: 'primary.light',
                        pb: 1
                      }}
                    >
                      {community.communityName}
                    </Typography>

                    {/* CGC Badge - Multiple CGCs */}
                    {community.cgc && community.cgc.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            mb: 1
                          }}
                        >
                          Leaders ({community.cgc.length})
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
                          <Table size="small" aria-label="leaders table">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 600, py: 1 }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 600, py: 1 }}>Position</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {community.cgc.map((cgc) => {
                                 let position = "";
                                 if (community.cgcPositions) {
                                   if (community.cgcPositions.president === cgc._id) position = "President";
                                   else if (community.cgcPositions.networkingDirector === cgc._id) position = "Networking Director";
                                   else if (community.cgcPositions.membershipDirector === cgc._id) position = "Membership Director";
                                 }
                                return (
                                  <TableRow
                                    key={cgc._id}
                                  >
                                    <TableCell component="th" scope="row" sx={{ py: 1 }}>
                                      {cgc.fname} {cgc.lname}
                                    </TableCell>
                                    <TableCell sx={{ py: 1, color: position ? 'primary.main' : 'text.secondary' }}>
                                      {position || '-'}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Core Group */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Core Group:</strong> {community.coreGroup?.name || "N/A"}
                      </Typography>
                    </Box>

                    {/* Community Type */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Type:</strong>{" "}
                        {Array.isArray(community.communityType)
                          ? community.communityType.join(", ")
                          : community.communityType || "N/A"}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Location Info */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Location:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 0 }}>
                        {community.cities.join(", ")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 0 }}>
                        {community.states.join(", ")}, {community.countries.join(", ")}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Core Members */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                         <strong>Core Members ({community.coreMembers.length}):</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ pl: 2.5 }}>
                        {community.coreMembers
                          .filter((m) => m && m.name)
                          .map((m) => m.name)
                          .join(", ") || "None"}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        onClick={() => openDialog("editCommunity", community._id)}
                        color="primary"
                        size="small"
                        sx={{ '&:hover': { bgcolor: 'primary.light' } }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => openDialog("deleteCommunity", community._id)}
                        color="error"
                        size="small"
                        sx={{ '&:hover': { bgcolor: 'error.light' } }}
                      >
                        <Delete />
                      </IconButton>
                      <IconButton
                        onClick={() => navigate(`/community-members/${community._id}`)}
                        color="info"
                        size="small"
                        sx={{ '&:hover': { bgcolor: 'info.light' } }}
                        title="Add Members"
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      <Dialog
        open={dialog.open}
        onClose={() => {
          setDialog({ open: false, mode: null });
          setSelectedCountry("");
          setSelectedState("");
          setSelectedCommunityCountry("");
          setSelectedCommunityState("");
        }}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {dialog.mode === "createCoreGroup"
            ? "Create Core Group"
            : dialog.mode === "editCoreGroup"
            ? "Edit Core Group"
            : dialog.mode === "deleteCoreGroup"
            ? "Delete Core Group"
            : dialog.mode === "createCommunity"
            ? "Create Community"
            : dialog.mode === "editCommunity"
            ? "Edit Community"
            : "Delete Community"}
        </DialogTitle>
        <DialogContent>
          {dialog.mode === "createCoreGroup" ||
          dialog.mode === "editCoreGroup" ? (
            <Box>
              <TextField
                fullWidth
                label="Name"
                value={coreGroupForm.name}
                onChange={(e) =>
                  setCoreGroupForm({ ...coreGroupForm, name: e.target.value })
                }
                margin="normal"
                error={!!errors.name}
                helperText={errors.name}
              />
              <FormControl fullWidth margin="normal" error={!!errors.countries}>
                <InputLabel>Country</InputLabel>
                <MuiSelect
                  value={selectedCountry}
                  onChange={(e) => {
                    const country = e.target.value as string;
                    setCoreGroupForm({
                      ...coreGroupForm,
                      countries: [country],
                      states: [],
                      cities: [],
                    });
                    setSelectedCountry(country);
                    setSelectedState("");
                  }}
                  label="Country"
                >
                  {Country.getAllCountries().map((country) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.countries && (
                  <Typography color="error">{errors.countries}</Typography>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal" error={!!errors.states}>
                <InputLabel>
                  {getLocationFieldLabels(coreGroupForm.countries).stateLabel}
                </InputLabel>
                <MuiSelect
                  value={selectedState}
                  onChange={(e) => {
                    const state = e.target.value as string;
                    setCoreGroupForm({
                      ...coreGroupForm,
                      states: [state],
                      cities: [],
                    });
                    setSelectedState(state);
                  }}
                  label={
                    getLocationFieldLabels(coreGroupForm.countries).stateLabel
                  }
                  disabled={
                    !selectedCountry ||
                    !getLocationFieldVisibility(coreGroupForm.countries, selectedState).showStateField
                  }
                >
                  {State.getStatesOfCountry(selectedCountry).map((state) => (
                    <MenuItem key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.states && (
                  <Typography color="error">{errors.states}</Typography>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal" error={!!errors.cities}>
                <InputLabel>
                  {
                    getLocationFieldLabels(
                      coreGroupForm.countries,
                      coreGroupForm.states
                    ).cityLabel
                  }
                </InputLabel>
                <MuiSelect
                  multiple
                  value={coreGroupForm.cities}
                  onChange={(e) =>
                    setCoreGroupForm({
                      ...coreGroupForm,
                      cities: e.target.value as string[],
                    })
                  }
                  label={
                    getLocationFieldLabels(
                      coreGroupForm.countries,
                      coreGroupForm.states
                    ).cityLabel
                  }
                  renderValue={(selected) => (selected as string[]).join(", ")}
                  disabled={
                    !selectedState ||
                    !getLocationFieldVisibility(coreGroupForm.countries, selectedState).showCityField
                  }
                >
                  {(() => {
                    const cities = City.getCitiesOfState(selectedCountry, selectedState);
                    console.log("Cities for", selectedCountry, selectedState, ":", cities);

                    if (!cities || cities.length === 0) {
                      return (
                        <MenuItem disabled>
                          <Typography color="textSecondary" variant="body2">
                            No cities available in library. Use manual input below.
                          </Typography>
                        </MenuItem>
                      );
                    }

                    return cities.map((city) => (
                      <MenuItem key={city.name} value={city.name}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {city.name}
                          {coreGroupForm.cities.includes(city.name) && (
                            <Check sx={{ color: "blue", ml: "auto" }} />
                          )}
                        </Box>
                      </MenuItem>
                    ));
                  })()}
                </MuiSelect>
                {errors.cities && (
                  <Typography color="error">{errors.cities}</Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Or type city names manually (comma-separated)"
                placeholder="e.g., Ahmedabad, Surat, Vadodara"
                helperText="Enter multiple cities separated by commas"
                disabled={!selectedState}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = (e.target as HTMLInputElement).value.trim();
                    if (input) {
                      const newCities = input.split(',').map(city => city.trim()).filter(city => city);
                      const uniqueCities = [...new Set([...coreGroupForm.cities, ...newCities])];
                      setCoreGroupForm({
                        ...coreGroupForm,
                        cities: uniqueCities,
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.coreMemberIds}
              >
                <InputLabel>Core Members</InputLabel>
                <MuiSelect
                  multiple
                  value={coreGroupForm.coreMemberIds}
                  onChange={(e) => {
                    const newCoreMemberIds = e.target.value as string[];
                    // Remove any CGCs that are no longer in the selected core members
                    const updatedCgcIds = coreGroupForm.cgcIds.filter(cgcId =>
                      newCoreMemberIds.includes(cgcId)
                    );
                    // Also update CGC position assignments to remove members no longer selected
                    const updatedCGCAssignments = coreGroupCGCAssignments
                      .map(assignment => {
                        if (!newCoreMemberIds.includes(assignment.memberId)) {
                          return { memberId: "", position: "" };
                        }
                        return assignment;
                      });

                    setCoreGroupCGCAssignments(updatedCGCAssignments.length > 0 ? updatedCGCAssignments : [{ memberId: "", position: "" }]);
                    setCoreGroupForm({
                      ...coreGroupForm,
                      coreMemberIds: newCoreMemberIds,
                      cgcIds: updatedCgcIds,
                    });
                  }}
                  label="Core Members"
                  renderValue={(selected) =>
                    coreMembers
                      .filter((m) => (selected as string[]).includes(m._id))
                      .map((m) => `${m.fname} ${m.lname}`)
                      .join(", ")
                  }
                >
                  {coreMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {`${member.fname} ${member.lname}`}
                        {coreGroupForm.coreMemberIds.includes(member._id) && (
                          <Check sx={{ color: "blue", ml: "auto" }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.coreMemberIds && (
                  <Typography color="error">{errors.coreMemberIds}</Typography>
                )}
              </FormControl>

              {/* ✅ CGC Position Assignments - Inline Form */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: "primary.main" }}>
                  CGC Leadership Positions
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                  Assign leadership positions (President, Networking Director, Membership Director)
                </Typography>

                {coreGroupCGCAssignments.map((assignment, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                      position: "relative",
                    }}
                  >
                    <FormControl sx={{ flex: 1 }} size="small">
                      <InputLabel>Core Member</InputLabel>
                      <MuiSelect
                        value={assignment.memberId}
                        onChange={(e) => {
                          const newAssignments = [...coreGroupCGCAssignments];
                          newAssignments[index].memberId = e.target.value as string;
                          setCoreGroupCGCAssignments(newAssignments);
                        }}
                        label="Core Member"
                        disabled={coreGroupForm.coreMemberIds.length === 0}
                      >
                        <MenuItem value="">-- Select Member --</MenuItem>
                        {coreMembers
                          .filter((member) => coreGroupForm.coreMemberIds.includes(member._id))
                          .filter((member) =>
                            !coreGroupCGCAssignments.some((a, i) => i !== index && a.memberId === member._id)
                          )
                          .map((member) => (
                            <MenuItem key={member._id} value={member._id}>
                              {`${member.fname} ${member.lname}`}
                            </MenuItem>
                          ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl sx={{ flex: 1 }} size="small">
                      <InputLabel>Position</InputLabel>
                      <MuiSelect
                        value={assignment.position}
                        onChange={(e) => {
                          const newAssignments = [...coreGroupCGCAssignments];
                          newAssignments[index].position = e.target.value as string;
                          setCoreGroupCGCAssignments(newAssignments);
                        }}
                        label="Position"
                        disabled={!assignment.memberId}
                      >
                        <MenuItem value="">
                          {assignment.memberId ? "-- Select Position --" : "Select member first"}
                        </MenuItem>
                        {CGC_POSITIONS
                          .filter((pos) =>
                            !coreGroupCGCAssignments.some((a, i) => i !== index && a.position === pos.value)
                          )
                          .map((position) => (
                            <MenuItem key={position.value} value={position.value}>
                              {position.label}
                            </MenuItem>
                          ))}
                      </MuiSelect>
                    </FormControl>

                    {coreGroupCGCAssignments.length > 1 && (
                      <IconButton
                        onClick={() => {
                          const newAssignments = coreGroupCGCAssignments.filter((_, i) => i !== index);
                          setCoreGroupCGCAssignments(newAssignments.length > 0 ? newAssignments : [{ memberId: "", position: "" }]);
                        }}
                        sx={{ position: "absolute", top: 4, right: 4 }}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}

                {coreGroupCGCAssignments.length < 3 && (
                  <Button
                    onClick={() => {
                      setCoreGroupCGCAssignments([...coreGroupCGCAssignments, { memberId: "", position: "" }]);
                    }}
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{ mt: 1, textTransform: "none" }}
                    disabled={coreGroupForm.coreMemberIds.length === 0}
                    startIcon={<Add />}
                  >
                    Add Another Leader
                  </Button>
                )}

                {errors.cgcPositions && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                    {errors.cgcPositions}
                  </Typography>
                )}
              </Box>
            </Box>
          ) : dialog.mode === "deleteCoreGroup" ? (
            <Typography>
              Are you sure you want to delete this core group? This action
              cannot be undone.
            </Typography>
          ) : dialog.mode === "createCommunity" ||
            dialog.mode === "editCommunity" ? (
            <Box>
              <TextField
                fullWidth
                label="Community Name"
                value={communityForm.communityName}
                onChange={(e) =>
                  setCommunityForm({
                    ...communityForm,
                    communityName: e.target.value,
                  })
                }
                margin="normal"
                error={!!errors.communityName}
                helperText={errors.communityName}
              />
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.coreGroupId}
              >
                <InputLabel>Core Group</InputLabel>
                <MuiSelect
                  value={communityForm.coreGroupId}
                  onChange={(e) => {
                    setCommunityForm({
                      ...communityForm,
                      coreGroupId: e.target.value,
                      coreMemberIds: [],
                    });
                    fetchCoreMembersByGroup(e.target.value);
                  }}
                  label="Core Group"
                >
                  {coreGroups.map((group) => (
                    <MenuItem key={group._id} value={group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.coreGroupId && (
                  <Typography color="error">{errors.coreGroupId}</Typography>
                )}
              </FormControl>
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.coreMemberIds}
              >
                <InputLabel>Core Members</InputLabel>
                <MuiSelect
                  multiple
                  value={communityForm.coreMemberIds}
                  onChange={(e) => {
                    const newCoreMemberIds = e.target.value as string[];
                    // Remove any CGCs that are no longer in the selected core members
                    const updatedCgcIds = communityForm.cgcIds.filter(cgcId =>
                      newCoreMemberIds.includes(cgcId)
                    );
                    // Also update CGC position assignments to remove members no longer selected
                    const updatedCGCAssignments = communityCGCAssignments
                      .map(assignment => {
                        if (!newCoreMemberIds.includes(assignment.memberId)) {
                          return { memberId: "", position: "" };
                        }
                        return assignment;
                      });

                    setCommunityCGCAssignments(updatedCGCAssignments.length > 0 ? updatedCGCAssignments : [{ memberId: "", position: "" }]);
                    setCommunityForm({
                      ...communityForm,
                      coreMemberIds: newCoreMemberIds,
                      cgcIds: updatedCgcIds,
                    });
                  }}
                  label="Core Members"
                  disabled={!communityForm.coreGroupId}
                  renderValue={(selected) =>
                    filteredCoreMembers
                      .filter((m) => (selected as string[]).includes(m._id))
                      .map((m) => `${m.fname} ${m.lname}`)
                      .join(", ")
                  }
                >
                  {filteredCoreMembers.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        {`${member.fname} ${member.lname}`}
                        {communityForm.coreMemberIds.includes(member._id) && (
                          <Check sx={{ color: "blue", ml: "auto" }} />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.coreMemberIds && (
                  <Typography color="error">{errors.coreMemberIds}</Typography>
                )}
              </FormControl>

              {/* ✅ CGC Position Assignments - Inline Form */}
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, color: "primary.main" }}>
                  CGC Leadership Positions
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: "block" }}>
                  Assign leadership positions (President, Networking Director, Membership Director)
                </Typography>

                {communityCGCAssignments.map((assignment, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                      position: "relative",
                    }}
                  >
                    <FormControl sx={{ flex: 1 }} size="small">
                      <InputLabel>Core Member</InputLabel>
                      <MuiSelect
                        value={assignment.memberId}
                        onChange={(e) => {
                          const newAssignments = [...communityCGCAssignments];
                          newAssignments[index].memberId = e.target.value as string;
                          setCommunityCGCAssignments(newAssignments);
                        }}
                        label="Core Member"
                        disabled={!communityForm.coreGroupId || communityForm.coreMemberIds.length === 0}
                      >
                        <MenuItem value="">-- Select Member --</MenuItem>
                        {filteredCoreMembers
                          .filter((member) => communityForm.coreMemberIds.includes(member._id))
                          .filter((member) =>
                            !communityCGCAssignments.some((a, i) => i !== index && a.memberId === member._id)
                          )
                          .map((member) => (
                            <MenuItem key={member._id} value={member._id}>
                              {`${member.fname} ${member.lname}`}
                            </MenuItem>
                          ))}
                      </MuiSelect>
                    </FormControl>

                    <FormControl sx={{ flex: 1 }} size="small">
                      <InputLabel>Position</InputLabel>
                      <MuiSelect
                        value={assignment.position}
                        onChange={(e) => {
                          const newAssignments = [...communityCGCAssignments];
                          newAssignments[index].position = e.target.value as string;
                          setCommunityCGCAssignments(newAssignments);
                        }}
                        label="Position"
                        disabled={!assignment.memberId}
                      >
                        <MenuItem value="">
                          {assignment.memberId ? "-- Select Position --" : "Select member first"}
                        </MenuItem>
                        {CGC_POSITIONS
                          .filter((pos) =>
                            !communityCGCAssignments.some((a, i) => i !== index && a.position === pos.value)
                          )
                          .map((position) => (
                            <MenuItem key={position.value} value={position.value}>
                              {position.label}
                            </MenuItem>
                          ))}
                      </MuiSelect>
                    </FormControl>

                    {communityCGCAssignments.length > 1 && (
                      <IconButton
                        onClick={() => {
                          const newAssignments = communityCGCAssignments.filter((_, i) => i !== index);
                          setCommunityCGCAssignments(newAssignments.length > 0 ? newAssignments : [{ memberId: "", position: "" }]);
                        }}
                        sx={{ position: "absolute", top: 4, right: 4 }}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}

                {communityCGCAssignments.length < 3 && (
                  <Button
                    onClick={() => {
                      setCommunityCGCAssignments([...communityCGCAssignments, { memberId: "", position: "" }]);
                    }}
                    variant="outlined"
                    fullWidth
                    size="small"
                    sx={{ mt: 1, textTransform: "none" }}
                    disabled={!communityForm.coreGroupId || communityForm.coreMemberIds.length === 0}
                    startIcon={<Add />}
                  >
                    Add Another Leader
                  </Button>
                )}

                {errors.cgcPositions && (
                  <Typography color="error" variant="caption" sx={{ mt: 1, display: "block" }}>
                    {errors.cgcPositions}
                  </Typography>
                )}
              </Box>
              <FormControl fullWidth margin="normal" error={!!errors.countries}>
                <InputLabel>Country</InputLabel>
                <MuiSelect
                  value={selectedCommunityCountry}
                  onChange={(e) => {
                    const country = e.target.value as string;
                    setCommunityForm({
                      ...communityForm,
                      countries: [country],
                      states: [],
                      cities: [],
                    });
                    setSelectedCommunityCountry(country);
                    setSelectedCommunityState("");
                  }}
                  label="Country"
                >
                  {Country.getAllCountries().map((country) => (
                    <MenuItem key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.countries && (
                  <Typography color="error">{errors.countries}</Typography>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal" error={!!errors.states}>
                <InputLabel>
                  {getLocationFieldLabels(communityForm.countries).stateLabel}
                </InputLabel>
                <MuiSelect
                  value={selectedCommunityState}
                  onChange={(e) => {
                    const state = e.target.value as string;
                    setCommunityForm({
                      ...communityForm,
                      states: [state],
                      cities: [],
                    });
                    setSelectedCommunityState(state);
                  }}
                  label={
                    getLocationFieldLabels(communityForm.countries).stateLabel
                  }
                  disabled={
                    !selectedCommunityCountry ||
                    !getLocationFieldVisibility(communityForm.countries, selectedCommunityState).showStateField
                  }
                >
                  {State.getStatesOfCountry(selectedCommunityCountry).map(
                    (state) => (
                      <MenuItem key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </MenuItem>
                    )
                  )}
                </MuiSelect>
                {errors.states && (
                  <Typography color="error">{errors.states}</Typography>
                )}
              </FormControl>
              <FormControl fullWidth margin="normal" error={!!errors.cities}>
                <InputLabel>
                  {
                    getLocationFieldLabels(
                      communityForm.countries,
                      communityForm.states
                    ).cityLabel
                  }
                </InputLabel>
                <MuiSelect
                  multiple
                  value={communityForm.cities}
                  onChange={(e) =>
                    setCommunityForm({
                      ...communityForm,
                      cities: e.target.value as string[],
                    })
                  }
                  label={
                    getLocationFieldLabels(
                      communityForm.countries,
                      communityForm.states
                    ).cityLabel
                  }
                  renderValue={(selected) => (selected as string[]).join(", ")}
                  disabled={
                    !selectedCommunityState ||
                    !getLocationFieldVisibility(communityForm.countries, selectedCommunityState).showCityField
                  }
                >
                  {(() => {
                    const cities = City.getCitiesOfState(
                      selectedCommunityCountry,
                      selectedCommunityState
                    );
                    console.log("Cities for", selectedCommunityCountry, selectedCommunityState, ":", cities);

                    if (!cities || cities.length === 0) {
                      return (
                        <MenuItem disabled>
                          <Typography color="textSecondary" variant="body2">
                            No cities available in library. Use manual input below.
                          </Typography>
                        </MenuItem>
                      );
                    }

                    return cities.map((city) => (
                      <MenuItem key={city.name} value={city.name}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                          }}
                        >
                          {city.name}
                          {communityForm.cities.includes(city.name) && (
                            <Check sx={{ color: "blue", ml: "auto" }} />
                          )}
                        </Box>
                      </MenuItem>
                    ));
                  })()}
                </MuiSelect>
                {errors.cities && (
                  <Typography color="error">{errors.cities}</Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                margin="normal"
                label="Or type city names manually (comma-separated)"
                placeholder="e.g., Ahmedabad, Surat, Vadodara"
                helperText="Enter multiple cities separated by commas"
                disabled={!selectedCommunityState}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = (e.target as HTMLInputElement).value.trim();
                    if (input) {
                      const newCities = input.split(',').map(city => city.trim()).filter(city => city);
                      const uniqueCities = [...new Set([...communityForm.cities, ...newCities])];
                      setCommunityForm({
                        ...communityForm,
                        cities: uniqueCities,
                      });
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
              />
              <FormControl
                fullWidth
                margin="normal"
                error={!!errors.communityType}
              >
                <InputLabel>Community Type</InputLabel>
                <MuiSelect
                  multiple
                  value={communityForm.communityType}
                  onChange={(e) =>
                    setCommunityForm({
                      ...communityForm,
                      communityType: e.target.value as string[],
                    })
                  }
                  label="Community Type"
                  renderValue={(selected) => (selected as string[]).join(", ")}
                >
                  {communityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <Checkbox
                        checked={communityForm.communityType.includes(type)}
                      />
                      <ListItemText primary={type} />
                    </MenuItem>
                  ))}
                </MuiSelect>
                {errors.communityType && (
                  <Typography color="error">{errors.communityType}</Typography>
                )}
              </FormControl>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ marginTop: 16 }}
              />
              {errors.image && (
                <Typography color="error">{errors.image}</Typography>
              )}
              {previewImage && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{ maxWidth: "100%" }}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Typography>
              Are you sure you want to delete this community? This action cannot
              be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialog({ open: false, mode: null });
              setSelectedCountry("");
              setSelectedState("");
              setSelectedCommunityCountry("");
              setSelectedCommunityState("");
            }}
          >
            Cancel
          </Button>
          {dialog.mode === "createCoreGroup" ||
          dialog.mode === "editCoreGroup" ? (
            <Button
              onClick={handleCoreGroupSubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {dialog.mode === "createCoreGroup" ? "Create" : "Update"}
            </Button>
          ) : dialog.mode === "deleteCoreGroup" ? (
            <Button
              onClick={handleDeleteCoreGroup}
              variant="contained"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Delete
            </Button>
          ) : dialog.mode === "createCommunity" ||
            dialog.mode === "editCommunity" ? (
            <Button
              onClick={handleCommunitySubmit}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {dialog.mode === "createCommunity" ? "Create" : "Update"}
            </Button>
          ) : (
            <Button
              onClick={handleDeleteCommunity}
              variant="contained"
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Delete
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityPage;
