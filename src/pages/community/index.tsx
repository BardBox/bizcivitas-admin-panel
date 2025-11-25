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
}

interface Member {
  _id: string;
  fname: string;
  lname: string;
}

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
  }>({ name: "", coreMemberIds: [], countries: [], states: [], cities: [] });
  const [communityForm, setCommunityForm] = useState<{
    communityName: string;
    coreGroupId: string;
    coreMemberIds: string[];
    countries: string[];
    states: string[];
    cities: string[];
    communityType: string[];
    image: File | null;
  }>({
    communityName: "",
    coreGroupId: "",
    coreMemberIds: [],
    countries: [],
    states: [],
    cities: [],
    communityType: [],
    image: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [filteredCoreMembers, setFilteredCoreMembers] = useState<Member[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCommunityCountry, setSelectedCommunityCountry] = useState("");
  const [selectedCommunityState, setSelectedCommunityState] = useState("");

  useEffect(() => {
    fetchCoreGroups();
    fetchCommunities();
    fetchCoreMembers();
  }, []);

  const getLocationFieldVisibility = (countries: string[]): LocationFieldVisibility => {
    return {
      showCountry: true,
      showState: countries.length > 0,
      showCity: countries.length > 0 && selectedState !== "",
      showCommunity: false,
      disableState: countries.length === 0,
      disableCity: countries.length === 0 || selectedState === "",
      disableCommunity: true,
      showStateField: countries.length > 0,
      showCityField: countries.length > 0 && selectedState !== "",
    };
  };

  const fetchCoreGroups = async () => {
    try {
      const response: AxiosResponse<{ data: CoreGroup[] }> = await api.get(
        "/coregroup"
      );
      setCoreGroups(response.data.data);
    } catch (error) {
      console.error("Error fetching core groups:", error);
      toast.error("Failed to fetch core groups.");
    }
  };

  const fetchCommunities = async () => {
    try {
      const response: AxiosResponse<{ data: Community[] }> = await api.get(
        "/community"
      );
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
      console.error("Error fetching communities:", error);
      toast.error("Failed to fetch communities.");
    }
  };

  const fetchCoreMembers = async () => {
    try {
      const response: AxiosResponse<{ data: Member[] }> = await api.get(
        "/core-members"
      );
      setCoreMembers(response.data.data);
    } catch (error) {
      console.error("Error fetching core members:", error);
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
      });
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
        });
        setSelectedCountry(coreGroup.countries[0] || "");
        setSelectedState(coreGroup.states[0] || "");
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
      });
      setFilteredCoreMembers([]);
      setSelectedCommunityCountry("");
      setSelectedCommunityState("");
    } else if (mode === "editCommunity" && id) {
      const community = communities.find((c) => c._id === id);
      if (community) {
        setCommunityForm({
          communityName: community.communityName,
          coreGroupId: community.coreGroup?._id || "",
          coreMemberIds: community.coreMembers.map((m) => m.id),
          countries: community.countries,
          states: community.states,
          cities: community.cities,
          communityType: Array.isArray(community.communityType)
            ? community.communityType
            : community.communityType
            ? [community.communityType]
            : [],
          image: null,
        });
        setPreviewImage(
          `${import.meta.env.VITE_API_BASE_URL}/image/${community.image}`
        );
        setSelectedCommunityCountry(community.countries[0] || "");
        setSelectedCommunityState(community.states[0] || "");
        if (community.coreGroup?._id) {
          fetchCoreMembersByGroup(community.coreGroup._id);
        }
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
      };
      if (dialog.mode === "createCoreGroup") {
        await api.post("/coregroup/", payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Core Group created successfully.");
      } else if (dialog.mode === "editCoreGroup" && dialog.coreGroupId) {
        await api.put(`/coregroup/${dialog.coreGroupId}`, payload, {
          headers: { "Content-Type": "application/json" },
        });
        toast.success("Core Group updated successfully.");
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
      if (dialog.mode === "createCommunity") {
        await api.post("/community", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Community created successfully.");
      } else if (dialog.mode === "editCommunity" && dialog.communityId) {
        await api.put(`/community/${dialog.communityId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Community updated successfully.");
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
    <Box sx={{ p: 3 }}>
      <ToastContainer />
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Core Groups" />
        <Tab label="Communities" />
      </Tabs>
      {tabValue === 0 && (
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => openDialog("createCoreGroup")}
            sx={{ mb: 3 }}
          >
            Add Core Group
          </Button>
          <Grid container spacing={3}>
            {coreGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={group._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{group.name}</Typography>
                    <Typography>
                      Countries: {group.countries.join(", ")}
                    </Typography>
                    <Typography>States: {group.states.join(", ")}</Typography>
                    <Typography>Cities: {group.cities.join(", ")}</Typography>
                    <Typography>
                      Core Members:{" "}
                      {group.coreMembers
                        .map((m) => `${m.fname} ${m.lname}`)
                        .join(", ")}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <IconButton
                        onClick={() => openDialog("editCoreGroup", group._id)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => openDialog("deleteCoreGroup", group._id)}
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
            sx={{ mb: 3 }}
          >
            Add Community
          </Button>
          <Grid container spacing={3}>
            {communities.map((community) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={community._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {community.communityName}
                    </Typography>
                    <Typography>
                      Core Group: {community.coreGroup?.name || "N/A"}
                    </Typography>
                    <Typography>
                      Countries: {community.countries.join(", ")}
                    </Typography>
                    <Typography>
                      States: {community.states.join(", ")}
                    </Typography>
                    <Typography>
                      Cities: {community.cities.join(", ")}
                    </Typography>
                    <Typography>
                      Community Type:{" "}
                      {Array.isArray(community.communityType)
                        ? community.communityType.join(", ")
                        : community.communityType || ""}
                    </Typography>
                    <Typography>
                      Core Members:{" "}
                      {community.coreMembers
                        .filter((m) => m && m.name)
                        .map((m) => m.name)
                        .join(", ") || "None"}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <IconButton
                        onClick={() =>
                          openDialog("editCommunity", community._id)
                        }
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          openDialog("deleteCommunity", community._id)
                        }
                      >
                        <Delete />
                      </IconButton>
                      <IconButton
                        onClick={() =>
                          navigate(`/community-members/${community._id}`)
                        }
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
                    !getLocationFieldVisibility(coreGroupForm.countries).showStateField
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
                    !getLocationFieldVisibility(coreGroupForm.countries).showCityField
                  }
                >
                  {City.getCitiesOfState(selectedCountry, selectedState)?.map(
                    (city) => (
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
                    )
                  )}
                </MuiSelect>
                {errors.cities && (
                  <Typography color="error">{errors.cities}</Typography>
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
                  value={coreGroupForm.coreMemberIds}
                  onChange={(e) =>
                    setCoreGroupForm({
                      ...coreGroupForm,
                      coreMemberIds: e.target.value as string[],
                    })
                  }
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
                  onChange={(e) =>
                    setCommunityForm({
                      ...communityForm,
                      coreMemberIds: e.target.value as string[],
                    })
                  }
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
                    !getLocationFieldVisibility(communityForm.countries).showStateField
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
                    !getLocationFieldVisibility(communityForm.countries).showCityField
                  }
                >
                  {City.getCitiesOfState(
                    selectedCommunityCountry,
                    selectedCommunityState
                  )?.map((city) => (
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
                  ))}
                </MuiSelect>
                {errors.cities && (
                  <Typography color="error">{errors.cities}</Typography>
                )}
              </FormControl>
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
