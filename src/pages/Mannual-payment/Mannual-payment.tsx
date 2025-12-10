import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Autocomplete,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";
import { Country, State, City } from "country-state-city";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumber } from 'libphonenumber-js';
import { getAllZones } from "../../api/zoneApi";
import { getAreasByZone } from "../../api/areaApi";

interface User {
  _id: string;
  fname: string;
  lname?: string;
  email: string;
  mobile?: string;
  membershipType: string;
  isActive: boolean;
  renewalDate?: string;
  membershipIcon: string;
  paymentVerification: any[];
}

interface ReferrerOption {
  id: string;
  label: string;
}

interface PaymentStatus {
  totalFees: number;
  completed: number;
  pending: number;
  pendingFees: { feeType: string; amount: number; status: string }[];
  isFullyPaid: boolean;
  completedFees: {
    feeType: string;
    amount: number;
    status: string;
    paymentMethod: string;
    cashId?: string;
    checkId?: string;
  }[];
}

interface FormData {
  email: string;
  mobile: string;
  fname: string;
  lname: string;
  referBy: string;
  region: string;
  country: string;
  state: string;
  city: string;
  zoneId: string;
  areaId: string;
  membershipType: string;
  business: string;
  businessSubcategory: string;
  feeType: string;
  amount: number;
  paymentMethod: string;
  cashId: string;
  checkId: string;
}

interface ApiResponse {
  success: boolean;
  status: number;
  data: {
    user: User;
    paymentStatus: PaymentStatus;
    nextStep: string;
  };
  message: string;
}

const membershipFees = {
  "Core Membership": { registration: 25000, annual: 300000, community_launching: 225000 },
  "Flagship Membership": { registration: 25000, annual: 300000, meeting: 25000 },
  "Industria Membership": { registration: 25000, annual: 300000, meeting: 25000 },
  "Digital Membership": { registration: 6999 },
  "Digital Membership Trial": { registration: 0 },
};

const membershipTypes = [
  "Core Membership",
  "Flagship Membership",
  "Industria Membership",
  "Digital Membership",
  "Digital Membership Trial",
];

type MembershipType = keyof typeof membershipFees;

const feeTypesMap: Record<MembershipType, string[]> = {
  "Core Membership": ["registration", "annual", "community_launching"],
  "Flagship Membership": ["registration", "annual", "meeting"],
  "Industria Membership": ["registration", "annual", "meeting"],
  "Digital Membership": ["registration"],
  "Digital Membership Trial": ["registration"],
};

const paymentMethods = ["cash", "check"];

const ManualPaymentForm: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      email: "",
      mobile: "",
      fname: "",
      lname: "",
      referBy: "",
      region: "",
      country: "IN",
      state: "",
      city: "",
      zoneId: "",
      areaId: "",
      membershipType: "",
      business: "",
      businessSubcategory: "",
      feeType: "",
      amount: 0,
      paymentMethod: "",
      cashId: "",
      checkId: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [referrerOptions, setReferrerOptions] = useState<ReferrerOption[]>([]);
  const [referrersLoading, setReferrersLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // Zone and Area States
  const [zones, setZones] = useState<any[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);

  const membershipType = useWatch({ control, name: "membershipType" });
  const feeType = useWatch({ control, name: "feeType" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const business = useWatch({ control, name: "business" });
  const country = useWatch({ control, name: "country" });
  const state = useWatch({ control, name: "state" });
  const zoneId = useWatch({ control, name: "zoneId" });

  const countryOptions = Country.getAllCountries();
  const stateOptions = country ? State.getStatesOfCountry(country) : [];
  const cityOptions = country && state ? City.getCitiesOfState(country, state) : [];

  // Fetch Zones when State changes
  useEffect(() => {
    const fetchZones = async () => {
      // Clear previous selections
      setZones([]);
      setAreas([]);

      if (!country || !state) return;

      // Only fetch zones if NOT a Digital Membership (or if you want zones for Digital too, remove check)
      // But typically Zones are for Franchise structure.
      // Based on requirement to "Replace region field", we focus on non-Digital.
      if (!["Digital Membership", "Digital Membership Trial"].includes(membershipType)) {
        setZonesLoading(true);
        try {
          const countryName = Country.getCountryByCode(country)?.name || "";
          const stateName = State.getStateByCodeAndCountry(state, country)?.name || "";

          if (countryName && stateName) {
            const fetchedZones = await getAllZones({
              countryId: countryName,
              stateId: stateName
            });
            setZones(fetchedZones || []);
          }
        } catch (error) {
          console.error("Failed to fetch zones:", error);
          toast.error("Failed to load zones.");
        } finally {
          setZonesLoading(false);
        }
      }
    };

    fetchZones();
    // Whenever State changes, reset dependent fields
    setValue("zoneId", "");
    setValue("areaId", "");
  }, [country, state, membershipType, setValue]);

  // Fetch Areas when Zone changes
  useEffect(() => {
    const fetchAreas = async () => {
      if (!zoneId) {
        setAreas([]);
        return;
      }
      setAreasLoading(true);
      try {
        const fetchedAreas = await getAreasByZone(zoneId);
        setAreas(fetchedAreas || []);
      } catch (error) {
        console.error("Failed to fetch areas:", error);
        toast.error("Failed to load areas.");
      } finally {
        setAreasLoading(false);
      }
    };

    fetchAreas();
    setValue("areaId", "");
  }, [zoneId, setValue]);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await api.get("/categories");
        const fetchedCategories = Array.isArray(response.data) ? response.data : [];
        setCategories(fetchedCategories);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch categories.");
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!business) {
      setSubcategories([]);
      setValue("businessSubcategory", "");
      return;
    }
    const fetchSubcategories = async () => {
      setSubcategoriesLoading(true);
      try {
        const response = await api.get(`/subcategories/${encodeURIComponent(business)}`);
        const fetchedSubcategories = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
            ? response.data
            : [];
        setSubcategories(fetchedSubcategories);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch subcategories.");
      } finally {
        setSubcategoriesLoading(false);
      }
    };
    fetchSubcategories();
    setValue("businessSubcategory", "");
  }, [business, setValue]);

  useEffect(() => {
    const fetchReferrers = async () => {
      setReferrersLoading(true);
      try {
        const response = await api.get("/core-members");
        if (response.data.success) {
          const options = Array.isArray(response.data.data)
            ? response.data.data.map((user: User) => ({
              id: user._id,
              label: `${user.fname} ${user.lname || ""}`.trim(),
            }))
            : [];
          setReferrerOptions(options);
        } else {
          toast.error(response.data.message || "Failed to fetch referrers.");
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch referrers.");
      } finally {
        setReferrersLoading(false);
      }
    };
    fetchReferrers();
  }, []);

  useEffect(() => {
    if (membershipType && feeType && membershipFees[membershipType as MembershipType]?.[feeType as keyof typeof membershipFees[MembershipType]]) {
      setValue("amount", membershipFees[membershipType as MembershipType][feeType as keyof typeof membershipFees[MembershipType]]);
    } else {
      setValue("amount", 0);
    }
  }, [membershipType, feeType, setValue]);

  const validateFormData = (data: FormData): string | null => {
    if (!data.fname?.trim()) return "First name is required";
    if (!data.email?.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(data.email)) return "Invalid email format";
    if (!data.membershipType?.trim()) return "Membership type is required";
    if (!data.feeType?.trim()) return "Fee type is required";
    if (data.membershipType !== "Digital Membership Trial" && !data.paymentMethod?.trim())
      return "Payment method is required";
    if (data.amount < 0) return "Amount must be greater than or equal to 0";
    if (data.cashId && data.paymentMethod !== "cash") return "Cash ID is only allowed for cash payments";
    if (data.checkId && data.paymentMethod !== "check") return "Check ID is only allowed for check payments";

    // Updated Location validation
    // Country and State are now required for ALL memberships to drive either City or Zone logic
    if (!data.country || !data.state) return "Country and State are required";

    if (["Digital Membership", "Digital Membership Trial"].includes(data.membershipType)) {
      if (!data.city) return "City is required for Digital Membership";
    } else {
      // For Non-Digital, we expect Zone and Area
      if (!data.zoneId) return "Zone is required";
      if (!data.areaId) return "Area is required";
    }

    if (data.mobile) {
      try {
        const parsed = parsePhoneNumber('+' + data.mobile);
        if (!parsed.isValid()) return "Invalid mobile number";
      } catch {
        return "Invalid phone number format";
      }
    }
    return null;
  };

  const preparePayload = (data: FormData) => {
    // Determine region name from selected Zone for backward compatibility
    let regionName = data.region;
    if (data.zoneId && !["Digital Membership", "Digital Membership Trial"].includes(data.membershipType)) {
      const selectedZone = zones.find(z => z._id === data.zoneId);
      if (selectedZone) {
        regionName = selectedZone.zoneName;
      }
    }

    const payload = {
      feeType: data.feeType,
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      fname: data.fname.trim(),
      email: data.email.trim(),
      membershipType: data.membershipType,
      referBy: data.referBy.trim() || undefined,
      lname: data.lname?.trim() || undefined,
      mobile: data.mobile ? data.mobile : undefined,
      region: regionName || undefined,
      country: data.country || undefined,
      state: data.state || undefined,
      city: data.city || undefined,
      zoneId: data.zoneId || undefined,
      areaId: data.areaId || undefined,
      business: data.business?.trim() || undefined,
      businessSubcategory: data.businessSubcategory?.trim() || undefined,
      cashId: data.paymentMethod === "cash" ? data.cashId?.trim() : undefined,
      checkId: data.paymentMethod === "check" ? data.checkId?.trim() : undefined,
    };
    Object.keys(payload).forEach((key) => {
      if (payload[key as keyof typeof payload] === undefined || payload[key as keyof typeof payload] === "") {
        delete payload[key as keyof typeof payload];
      }
    });
    return payload;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const validationError = validateFormData(data);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      const payload = preparePayload(data);
      const response = await api.post("/users/manual-payment", payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.success || response.data.status === 201) {
        setResponse(response.data);
        toast.success(response.data.message || "Payment recorded successfully.");
        // Reset Logic
        reset({
          email: "",
          mobile: "",
          fname: "",
          lname: "",
          referBy: "",
          region: "",
          country: "IN",
          state: "",
          city: "",
          zoneId: "",
          areaId: "",
          membershipType: "",
          business: "",
          businessSubcategory: "",
          feeType: "",
          amount: 0,
          paymentMethod: "",
          cashId: "",
          checkId: "",
        });
      } else {
        toast.error(response.data.message || "Failed to record payment.");
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message?.includes("timeout")) {
        toast.error("Request timeout. Please check your connection and try again.");
      } else {
        toast.error("Failed to record payment.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset({
      email: "",
      mobile: "",
      fname: "",
      lname: "",
      referBy: "",
      region: "",
      country: "IN",
      state: "",
      city: "",
      zoneId: "",
      areaId: "",
      membershipType: "",
      business: "",
      businessSubcategory: "",
      feeType: "",
      amount: 0,
      paymentMethod: "",
      cashId: "",
      checkId: "",
    });
    setResponse(null);
    setZones([]);
    setAreas([]);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Manual Payment Form
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Personal Details - Unchanged */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="fname"
                control={control}
                rules={{ required: "First Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name *"
                    variant="outlined"
                    fullWidth
                    error={!!errors.fname}
                    helperText={errors.fname?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="lname"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    variant="outlined"
                    fullWidth
                    error={!!errors.lname}
                    helperText={errors.lname?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contact Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Invalid email format",
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email *"
                    variant="outlined"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="mobile"
                control={control}
                rules={{
                  validate: (value) => {
                    if (!value) return true;
                    try {
                      const parsed = parsePhoneNumber('+' + value);
                      return parsed.isValid() || 'Invalid mobile number';
                    } catch {
                      return 'Invalid phone number format';
                    }
                  },
                }}
                render={({ field }) => (
                  <div>
                    <PhoneInput
                      {...field}
                      country={'in'}
                      enableSearch
                      countryCodeEditable={false}
                      placeholder="Enter mobile number (optional)"
                      inputStyle={{
                        width: '100%',
                        height: '56px',
                        fontSize: '16px',
                        paddingLeft: '56px',
                        borderRadius: '4px',
                        border: errors.mobile ? '1px solid red' : '1px solid rgba(0, 0, 0, 0.23)',
                      }}
                      buttonStyle={{
                        border: 'none',
                        backgroundColor: 'transparent',
                      }}
                      containerStyle={{ width: '100%' }}
                      onChange={(value) => field.onChange(value)}
                    />
                    {errors.mobile && (
                      <Typography color="error" variant="caption">
                        {errors.mobile.message}
                      </Typography>
                    )}
                    <Typography variant="caption" color="textSecondary">
                      Format: valid per selected country (optional)
                    </Typography>
                  </div>
                )}
              />
            </Grid>

            {/* Membership Type */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Membership Type
              </Typography>
            </Grid>
            <Grid container spacing={2} sx={{ p: "20px" }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="membershipType"
                  control={control}
                  rules={{ required: "Membership Type is required" }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.membershipType}>
                      <InputLabel id="membership-type-label">Membership Type *</InputLabel>
                      <Select
                        {...field}
                        labelId="membership-type-label"
                        label="Membership Type *"
                        fullWidth
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setValue("feeType", "");
                          setValue(
                            "amount",
                            membershipFees[e.target.value as MembershipType]?.registration || 0
                          );
                          setValue("cashId", "");
                          setValue("checkId", "");
                          // Reset location fields on membership change if needed, but not necessary
                        }}
                      >
                        <MenuItem value="">
                          <em>Select a membership type</em>
                        </MenuItem>
                        {membershipTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.membershipType && (
                        <Typography color="error" variant="caption">
                          {errors.membershipType.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="referBy"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={referrerOptions}
                      loading={referrersLoading}
                      getOptionLabel={(option) => option.label}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      value={referrerOptions.find((option) => option.id === field.value) || null}
                      onChange={(_, newValue) => field.onChange(newValue?.id || "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Referrer (Optional)"
                          variant="outlined"
                          fullWidth
                          error={!!errors.referBy}
                          helperText={
                            errors.referBy?.message || (referrersLoading ? "Loading referrers..." : "")
                          }
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {referrersLoading && <CircularProgress color="inherit" size={20} />}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "56px",
                            },
                          }}
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* Unified Location Hierarchy */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location Details
              </Typography>
            </Grid>

            {/* Country - All Memberships */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="country"
                control={control}
                rules={{ required: "Country is required" }}
                render={({ field }) => (
                  <Autocomplete
                    options={countryOptions}
                    getOptionLabel={(option) => option.name}
                    value={countryOptions.find((option) => option.isoCode === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.isoCode || "");
                      setValue("state", "");
                      setValue("city", "");
                      setValue("zoneId", "");
                      setValue("areaId", "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Country *"
                        variant="outlined"
                        error={!!errors.country}
                        helperText={errors.country?.message}
                        required
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* State - All Memberships */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="state"
                control={control}
                rules={{ required: "State is required" }}
                render={({ field }) => (
                  <Autocomplete
                    options={stateOptions}
                    getOptionLabel={(option) => option.name}
                    value={stateOptions.find((option) => option.isoCode === field.value) || null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.isoCode || "");
                      setValue("city", "");
                      setValue("zoneId", "");
                      setValue("areaId", "");
                    }}
                    disabled={!country}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="State *"
                        variant="outlined"
                        error={!!errors.state}
                        helperText={errors.state?.message || (!country ? "Please select a country first" : "")}
                        required
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Conditional: City for Digital */}
            {["Digital Membership", "Digital Membership Trial"].includes(membershipType) && (
              <Grid item xs={12} sm={4}>
                <Controller
                  name="city"
                  control={control}
                  rules={{ required: "City is required" }}
                  render={({ field }) => (
                    <Autocomplete
                      options={cityOptions}
                      getOptionLabel={(option) => option.name}
                      value={cityOptions.find((option) => option.name === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.name || "");
                      }}
                      disabled={!country || !state}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="City *"
                          variant="outlined"
                          error={!!errors.city}
                          helperText={errors.city?.message || (!country || !state ? "Please select country and state first" : "")}
                          required
                        />
                      )}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Conditional: Zone/Area for Non-Digital (Default view) */}
            {!["Digital Membership", "Digital Membership Trial"].includes(membershipType) && (
              <>
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="zoneId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth disabled={!state || zonesLoading} error={!!errors.zoneId}>
                        <InputLabel>Zone / City *</InputLabel>
                        <Select
                          {...field}
                          label="Zone / City *"
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Select a Zone / City</em>
                          </MenuItem>
                          {zones.map((zone) => (
                            <MenuItem key={zone._id} value={zone._id}>
                              {zone.zoneName}
                            </MenuItem>
                          ))}
                        </Select>
                        {zonesLoading && <Typography variant="caption">Loading zones...</Typography>}
                        {errors.zoneId && <Typography variant="caption" color="error">{errors.zoneId.message}</Typography>}
                      </FormControl>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="areaId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth disabled={!zoneId || areasLoading} error={!!errors.areaId}>
                        <InputLabel>Area *</InputLabel>
                        <Select
                          {...field}
                          label="Area *"
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <MenuItem value="">
                            <em>Select an Area</em>
                          </MenuItem>
                          {areas.map((area) => (
                            <MenuItem key={area._id} value={area._id}>
                              {area.areaName}
                            </MenuItem>
                          ))}
                        </Select>
                        {areasLoading && <Typography variant="caption">Loading areas...</Typography>}
                        {errors.areaId && <Typography variant="caption" color="error">{errors.areaId.message}</Typography>}
                      </FormControl>
                    )}
                  />
                </Grid>
              </>
            )}



            {/* Business Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Business Details
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="business"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.business}>
                    <InputLabel>Business Category</InputLabel>
                    <Select
                      {...field}
                      label="Business Category"
                      disabled={categoriesLoading}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setValue("businessSubcategory", "");
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a category</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.business && (
                      <Typography color="error" variant="caption">
                        {errors.business.message}
                      </Typography>
                    )}
                    {categoriesLoading && (
                      <Typography color="textSecondary" variant="caption">
                        Loading categories...
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="businessSubcategory"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.businessSubcategory}>
                    <InputLabel>Business Subcategory</InputLabel>
                    <Select
                      {...field}
                      label="Business Subcategory"
                      disabled={!business || subcategoriesLoading}
                    >
                      <MenuItem value="">
                        <em>Select a subcategory</em>
                      </MenuItem>
                      {subcategories.map((subcategory) => (
                        <MenuItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.businessSubcategory && (
                      <Typography color="error" variant="caption">
                        {errors.businessSubcategory.message}
                      </Typography>
                    )}
                    {!business && (
                      <Typography color="textSecondary" variant="caption">
                        Please select a business category first
                      </Typography>
                    )}
                    {business && subcategoriesLoading && (
                      <Typography color="textSecondary" variant="caption">
                        Loading subcategories...
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="feeType"
                control={control}
                rules={{ required: "Fee Type is required" }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.feeType}>
                    <InputLabel>Fee Type *</InputLabel>
                    <Select
                      {...field}
                      label="Fee Type *"
                      required
                      disabled={!membershipType}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a fee type</em>
                      </MenuItem>
                      {feeTypesMap[membershipType as MembershipType]?.map((type: string) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.feeType && (
                      <Typography color="error" variant="caption">
                        {errors.feeType.message}
                      </Typography>
                    )}
                    {!membershipType && (
                      <Typography color="textSecondary" variant="caption">
                        Please select a membership type first
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>
            {
              membershipType !== "Digital Membership Trial" && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="amount"
                      control={control}
                      rules={{
                        required: "Amount is required",
                        min: { value: 0, message: "Amount must be greater than or equal to 0" },
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Amount *"
                          type="number"
                          variant="outlined"
                          fullWidth
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      rules={{ required: "Payment Method is required" }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.paymentMethod}>
                          <InputLabel>Payment Method *</InputLabel>
                          <Select
                            {...field}
                            label="Payment Method *"
                            required
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setValue("cashId", "");
                              setValue("checkId", "");
                            }}
                          >
                            <MenuItem value="">
                              <em>Select a payment method</em>
                            </MenuItem>
                            {paymentMethods.map((method) => (
                              <MenuItem key={method} value={method}>
                                {method.charAt(0).toUpperCase() + method.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.paymentMethod && (
                            <Typography color="error" variant="caption">
                              {errors.paymentMethod.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  {paymentMethod === "cash" && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="cashId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Cash ID (Optional)"
                            variant="outlined"
                            fullWidth
                            error={!!errors.cashId}
                            helperText={errors.cashId?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}
                  {paymentMethod === "check" && (
                    <Grid item xs={12} sm={6}>
                      <Controller
                        name="checkId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            label="Check ID (Optional)"
                            variant="outlined"
                            fullWidth
                            error={!!errors.checkId}
                            helperText={errors.checkId?.message}
                          />
                        )}
                      />
                    </Grid>
                  )}
                </>
              )
            }
            <Grid item xs={12}>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !isValid}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  size="large"
                >
                  {loading ? "Recording Payment..." : "Record Payment"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={handleReset}
                  disabled={loading}
                  size="large"
                >
                  Reset Form
                </Button>
              </Box>
            </Grid>
          </Grid >
        </form >
        {response && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    User Details
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>
                      <strong>User ID:</strong> {response.data.user._id}
                    </Typography>
                    <Typography>
                      <strong>Name:</strong> {response.data.user.fname} {response.data.user.lname || ""}
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {response.data.user.email}
                    </Typography>
                    <Typography>
                      <strong>Membership:</strong> {response.data.user.membershipType}
                    </Typography>
                    <Typography>
                      <strong>Status:</strong> {response.data.user.isActive ? "Active" : "Inactive"}
                    </Typography>
                    <Typography>
                      <strong>Renewal Date:</strong> {response.data.user.renewalDate ? new Date(response.data.user.renewalDate).toLocaleDateString() : "N/A"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Payment Status
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography>
                      <strong>Completed:</strong> {response.data.paymentStatus.completed}
                    </Typography>
                    <Typography>
                      <strong>Pending:</strong> {response.data.paymentStatus.pending}
                    </Typography>
                    <Typography>
                      <strong>Fully Paid:</strong> {response.data.paymentStatus.isFullyPaid ? "Yes" : "No"}
                    </Typography>
                    {response.data.paymentStatus.completedFees?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Completed Payments:
                        </Typography>
                        {response.data.paymentStatus.completedFees.map((fee, index) => (
                          <Box key={index} sx={{ pl: 1 }}>
                            <Typography variant="body2">
                              • {fee.feeType}: ₹{fee.amount} ({fee.status})
                            </Typography>
                            {fee.paymentMethod === "cash" && fee.cashId && (
                              <Typography variant="body2" sx={{ pl: 2 }}>
                                <strong>Cash ID:</strong> {fee.cashId}
                              </Typography>
                            )}
                            {fee.paymentMethod === "check" && fee.checkId && (
                              <Typography variant="body2" sx={{ pl: 2 }}>
                                <strong>Check ID:</strong> {fee.checkId}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    {response.data.paymentStatus.completed > 0 && (!response.data.paymentStatus.completedFees || response.data.paymentStatus.completedFees.length === 0) && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Latest Completed Payment:
                        </Typography>
                        {(response.data.user.paymentVerification ?? []).filter((p: any) => p.status === "completed").slice(-1).map((p: any, index: number) => (
                          <Box key={index} sx={{ pl: 1 }}>
                            <Typography variant="body2">
                              • {p.feeType}: ₹{p.amount} (Completed)
                            </Typography>
                            {p.paymentMethod === "cash" && p.cashId && (
                              <Typography variant="body2" sx={{ pl: 2 }}>
                                <strong>Cash ID:</strong> {p.cashId}
                              </Typography>
                            )}
                            {p.paymentMethod === "check" && p.checkId && (
                              <Typography variant="body2" sx={{ pl: 2 }}>
                                <strong>Check ID:</strong> {p.checkId}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    {response.data.paymentStatus.pendingFees.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Pending Fees:
                        </Typography>
                        {response.data.paymentStatus.pendingFees.map((fee, index) => (
                          <Typography key={index} variant="body2" sx={{ pl: 1 }}>
                            • {fee.feeType}: ₹{fee.amount} ({fee.status})
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>Next Step:</strong> {response.data.nextStep === "login" ? "User can now login" : "Complete remaining payments"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Paper >
    </Box >
  );
};

export default ManualPaymentForm;
