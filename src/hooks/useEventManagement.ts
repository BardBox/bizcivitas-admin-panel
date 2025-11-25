"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { City, State, Country } from "country-state-city"; // ✅ FIXED IMPORT

import { MultiValue } from "react-select";
import { useVisibility } from "../context/VisibilityContext";
import api from "../api/api";
import {
  getLocationFieldLabels,
  getLocationPlaceholders,
  getLocationFieldVisibility,
} from "../utils/locationUtils";
import { formatDateForInput } from "../utils/eventHelpers";
import { validateEventForm } from "../utils/eventValidation";
import { fetchEvents, fetchCommunities } from "../api/eventApi";
import {
  Event,
  EventForm,
  MembershipAccess,
  Community,
  EventAccessType,
  ApiResponse,
  Option,
  GroupedOption,
} from "../EventInterface/EventInterface";
import { SERVER_URL, DEFAULT_EVENT_STATE } from "../constants/eventConstants";

type UseEventManagementReturn = {
  // state
  events: Event[];
  communities: Community[];
  isFetching: boolean;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editingEvent: Event | null;
  isLoading: boolean;
  isDateDisabled: boolean;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (v: boolean) => void;
  eventToDelete: string | null;
  stateOptions: GroupedOption[];
  cityOptions: GroupedOption[];
  freeAccessStateOptions: GroupedOption[];
  freeAccessCityOptions: GroupedOption[];
  freeAccessCommunityOptions: Community[];
  newEvent: EventForm;
  setNewEvent: (v: EventForm | ((prev: EventForm) => EventForm)) => void;
  countryOptions: Option[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleLocationChange: (
    field: "country" | "state" | "region",
    selected: MultiValue<Option>
  ) => void;
  getLocationFieldLabels: typeof getLocationFieldLabels;
  getLocationPlaceholders: typeof getLocationPlaceholders;
  getLocationFieldVisibility: typeof getLocationFieldVisibility;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  handleEdit: (event: Event) => void;
  handleDelete: (eventId: string) => Promise<void>;
  confirmDelete: (eventId: string) => void;
  handleOpenParticipants: (event: Event) => void;
  navigate: ReturnType<typeof useNavigate>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export const useEventManagement = (
  refreshEvents?: () => void
): UseEventManagementReturn => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state
  const [events, setEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Form errors state (missing in earlier file)

  // Location options state
  const [stateOptions, setStateOptions] = useState<GroupedOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GroupedOption[]>([]);

  // Free access location state
  const [freeAccessStateOptions, setFreeAccessStateOptions] = useState<
    GroupedOption[]
  >([]);
  const [freeAccessCityOptions, setFreeAccessCityOptions] = useState<
    GroupedOption[]
  >([]);
  const [freeAccessCommunityOptions, setFreeAccessCommunityOptions] = useState<
    Community[]
  >([]);

  // Form state
  const [newEvent, setNewEvent] = useState<EventForm>(DEFAULT_EVENT_STATE);

  // Country options
  const countryOptions: Option[] = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  // Handle cascading location changes
  const handleLocationChange = async (
    field: "country" | "state" | "region",
    selected: MultiValue<Option>
  ) => {
    const hasAll = selected.some((item) => item.value.startsWith("ALL_"));

    setNewEvent((prev: EventForm) => {
      const updates: Partial<EventForm> = { [field]: selected };

      if (field === "country" && hasAll) {
        updates.state = [];
        updates.region = [];
      } else if (field === "state" && hasAll) {
        updates.region = [];
      }

      return { ...prev, ...updates };
    });

    // Determine current selections
    const countries =
      field === "country"
        ? selected.map((s) => s.value)
        : newEvent.country.map((c) => c.value);
    const states =
      field === "state"
        ? selected.map((s) => s.value)
        : newEvent.state.map((s) => s.value);
    const cities =
      field === "region"
        ? selected.map((c) => c.value)
        : newEvent.region.map((r) => r.value);

    // Fetch communities using your existing API function
    const fetchedCommunities = await fetchCommunities({
      countries,
      states,
      cities,
    });

    setNewEvent((prev) => ({
      ...prev,
      communityOptions: fetchedCommunities.map((c) => ({
        value: c._id,
        label: c.name,
      })),
      community: [], // clear previous selection if needed
    }));
  };

  // Hide sidebar and header when form or delete confirmation is open
  useEffect(() => {
    setSidebarAndHeaderVisibility(!showForm && !showDeleteConfirm);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [showForm, showDeleteConfirm, setSidebarAndHeaderVisibility]);

  // Country → State options (single effect)
  useEffect(() => {
    if (newEvent.country.length > 0) {
      const groupedStates: GroupedOption[] = newEvent.country.map((country) => {
        const countryData = Country.getAllCountries().find(
          (c) => c.isoCode === country.value
        );
        const states = State.getStatesOfCountry(country.value).map((state) => ({
          value: state.isoCode,
          label: state.name,
          country: countryData?.name || country.label,
        }));

        return {
          label: countryData?.name || country.label,
          options: states,
        };
      });
      setStateOptions(groupedStates);
    } else {
      // No default fallback to India - keep fields empty
      setStateOptions([]);
      setNewEvent((prev) => ({ ...prev, state: [], region: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.country]);

  // State → City options (single effect)
  useEffect(() => {
    if (newEvent.state.length > 0 && newEvent.country.length > 0) {
      const groupedCities: GroupedOption[] = [];

      newEvent.state.forEach((state) => {
        const countryCode =
          newEvent.country.find((country) =>
            State.getStatesOfCountry(country.value).some(
              (s) => s.isoCode === state.value
            )
          )?.value || newEvent.country[0]?.value;

        const countryData = Country.getAllCountries().find(
          (c) => c.isoCode === countryCode
        );
        const stateData = State.getStatesOfCountry(countryCode).find(
          (s) => s.isoCode === state.value
        );

        const cities = City.getCitiesOfState(countryCode, state.value).map(
          (city) => ({
            value: city.name,
            label: city.name,
            state: stateData?.name || state.label,
            country: countryData?.name || "",
          })
        );

        if (cities.length > 0) {
          groupedCities.push({
            label: `${stateData?.name || state.label} (${
              countryData?.name || ""
            })`,
            options: cities,
          });
        }
      });

      setCityOptions(groupedCities);
    } else {
      setCityOptions([]);
      setNewEvent((prev) => ({ ...prev, region: [] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.state, newEvent.country]);

  // Free access states effect
  useEffect(() => {
    const sourceCountries =
      newEvent.country.length > 0 &&
      !newEvent.country.some((c) => c.value === "ALL_COUNTRIES")
        ? [newEvent.country[0].value]
        : newEvent.freeAccessCountries.length > 0
        ? newEvent.freeAccessCountries
        : [];

    if (sourceCountries.length === 0) {
      setFreeAccessStateOptions([]);
      setNewEvent((prev) => ({
        ...prev,
        freeAccessStates: [],
        freeAccessCities: [],
        freeAccessCommunities: [],
      }));
      return;
    }

    const allStates: GroupedOption[] = [];
    sourceCountries.forEach((countryCode) => {
      const states = State.getStatesOfCountry(countryCode);
      if (states.length > 0) {
        allStates.push({
          label: `States in ${
            Country.getCountryByCode(countryCode)?.name || "Selected Country"
          }`,
          options: states.map((state) => ({
            value: state.isoCode,
            label: state.name,
            country: countryCode,
          })),
        });
      }
    });
    setFreeAccessStateOptions(allStates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.freeAccessCountries, newEvent.country]);

  // Free access cities effect
  useEffect(() => {
    const sourceCountries =
      newEvent.country.length > 0 &&
      !newEvent.country.some((c) => c.value === "ALL_COUNTRIES")
        ? [newEvent.country[0].value]
        : newEvent.freeAccessCountries.length > 0
        ? newEvent.freeAccessCountries
        : [];

    const sourceStates =
      newEvent.state.length > 0 &&
      !newEvent.country.some((c) => c.value === "ALL_COUNTRIES")
        ? newEvent.state.map((s) => s.value)
        : newEvent.freeAccessStates.length > 0
        ? newEvent.freeAccessStates
        : [];

    if (sourceCountries.length === 0 || sourceStates.length === 0) {
      setFreeAccessCityOptions([]);
      setNewEvent((prev) => ({
        ...prev,
        freeAccessCities: [],
        freeAccessCommunities: [],
      }));
      return;
    }

    const cityGroups: GroupedOption[] = [];
    sourceCountries.forEach((countryCode) => {
      sourceStates.forEach((stateCode) => {
        const cities = City.getCitiesOfState(countryCode, stateCode);
        const stateName = State.getStateByCodeAndCountry(
          stateCode,
          countryCode
        )?.name;

        if (cities.length > 0) {
          cityGroups.push({
            label: `Cities in ${stateName}`,
            options: cities.map((city) => ({
              value: city.name,
              label: city.name,
              state: stateCode,
              country: countryCode,
            })),
          });
        }
      });
    });
    setFreeAccessCityOptions(cityGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    newEvent.freeAccessStates,
    newEvent.freeAccessCountries,
    newEvent.country,
    newEvent.state,
  ]);

  // Main form communities effect
  useEffect(() => {
    const fetchCommunitiesForForm = async () => {
      if (newEvent.country.length === 0) {
        console.log("🚫 No country selected, clearing communities");
        setCommunities([]);
        return;
      }

      const hasAllCountries = newEvent.country.some(
        (c) => c.value === "ALL_COUNTRIES"
      );
      const hasAllStates = newEvent.state.some((s) => s.value === "ALL_STATES");
      const hasAllCities = newEvent.region.some(
        (r) => r.value === "ALL_CITIES"
      );

      try {
        let communitiesList: Community[] = [];
        let success = false;

        const mapEntities = (data: any[]) =>
          data.map((entity) => ({
            _id: entity._id,
            name: entity.name || entity.communityName || "Unknown",
            status: entity.status || "active",
            type: entity.type || "Community", // always set type
          }));

        if (hasAllCountries) {
          console.log("🌍 Fetching all communities globally");
          try {
            const response = await api.get("/meetings/entities");
            if (response.data.success && response.data.data.length > 0) {
              communitiesList = mapEntities(response.data.data);
              success = true;
            }
          } catch (error) {
            console.warn("⚠️ Global fetch failed:", error);
          }
        } else if (hasAllStates) {
          console.log(
            "🏛️ Fetching communities for all states in selected countries"
          );
          for (const country of newEvent.country) {
            try {
              const response = await api.get("/meetings/entities", {
                params: { country: country.value },
              });
              if (response.data.success && response.data.data.length > 0) {
                communitiesList = [
                  ...communitiesList,
                  ...mapEntities(response.data.data),
                ];
                success = true;
              }
            } catch (error) {
              console.warn(`⚠️ Failed for country ${country.value}:`, error);
            }
          }
        } else if (hasAllCities) {
          console.log(
            "🏙️ Fetching communities for all cities in selected states"
          );
          for (const country of newEvent.country) {
            for (const state of newEvent.state) {
              try {
                const response = await api.get("/meetings/entities", {
                  params: { country: country.value, state: state.value },
                });
                if (response.data.success && response.data.data.length > 0) {
                  communitiesList = [
                    ...communitiesList,
                    ...mapEntities(response.data.data),
                  ];
                  success = true;
                }
              } catch (error) {
                console.warn(`⚠️ Failed for state ${state.value}:`, error);
              }
            }
          }
        } else {
          // Normal case - multiple locations or fallback
          if (newEvent.region.length > 0) {
            const countries = newEvent.country.map((c) => c.value);
            const states = newEvent.state.map((s) => s.value);
            const cities = newEvent.region.map((r) => r.value);

            console.log("🔄 Fetching communities for multiple locations:", {
              countries,
              states,
              cities,
            });

            const fetched = await fetchCommunities({
              countries,
              states,
              cities,
            });
            communitiesList = fetched.map((c) => ({
              ...c,
              type: c.type || "Community",
            }));
            success = communitiesList.length > 0;
          } else {
            const params: Record<string, any> = {};
            if (newEvent.country.length > 0)
              params.country = newEvent.country[0].value;
            if (newEvent.state.length > 0)
              params.state = newEvent.state[0].value;

            const endpoints = [
              "/meetings/entities",
              "/core-groups/",
              "/community/",
            ];
            for (const endpoint of endpoints) {
              try {
                const response = await api.get(endpoint, { params });
                if (response.data.success && response.data.data.length > 0) {
                  communitiesList = mapEntities(response.data.data);
                  success = true;
                  console.log(`✅ Fetched from ${endpoint}`);
                  break;
                }
              } catch (error) {
                console.warn(`⚠️ Failed fetch from ${endpoint}:`, error);
              }
            }
          }

          if (!success) {
            console.log("🔄 Fallback fetch for communities");
            try {
              const fallback = await api.get("/meetings/entities");
              if (fallback.data.success && fallback.data.data.length > 0) {
                communitiesList = mapEntities(fallback.data.data);
              }
            } catch (error) {
              console.warn("⚠️ Fallback failed:", error);
            }
          }
        }

        // Remove duplicates
        const uniqueCommunities = communitiesList.filter(
          (c, i, arr) => i === arr.findIndex((x) => x._id === c._id)
        );
        setCommunities(uniqueCommunities);
        console.log("✅ Communities loaded:", uniqueCommunities.length);
      } catch (error) {
        console.error("❌ Error fetching communities:", error);
        setCommunities([]);
      }
    };

    fetchCommunitiesForForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.country, newEvent.state, newEvent.region]);

  // Free access communities effect
  useEffect(() => {
    const fetchFreeAccessCommunities = async () => {
      if (newEvent.country.length === 0) {
        setFreeAccessCommunityOptions([]);
        return;
      }

      const countries = newEvent.country.map((c) => c.value);
      const states = newEvent.state.map((s) => s.value);
      const cities = newEvent.freeAccessCities.map((c) => c.value);

      try {
        const fetchedCommunities = await fetchCommunities({
          countries,
          states,
          cities,
        });
        setFreeAccessCommunityOptions(fetchedCommunities);
        console.log(
          "✅ Free access communities fetched:",
          fetchedCommunities.length
        );
      } catch (error) {
        console.error("❌ Error fetching free access communities:", error);
        setFreeAccessCommunityOptions([]);
      }
    };

    fetchFreeAccessCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.country, newEvent.state, newEvent.freeAccessCities]);

  // Helper functions
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      console.log("No file selected");
      return;
    }

    const file = e.target.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

    console.log("Selected file:", file.name, "| Size:", fileSizeMB, "MB");

    if (file.size > maxSizeInBytes) {
      const errorMsg = "Image size exceeds 2MB. Please upload a smaller image.";
      toast.error(errorMsg);
      console.warn("File too large:", errorMsg);

      // Set inline form error
      setFormErrors((prev) => ({
        ...prev,
        img: errorMsg,
      }));

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        console.log("File input cleared");
      }

      // Reset image state
      setNewEvent((prev) => ({
        ...prev,
        img: null,
        imgPreview: null,
        imgChanged: false,
      }));
      console.log("Image state reset due to oversized file");

      return;
    }

    // Valid image: create preview and update state
    const previewUrl = URL.createObjectURL(file);
    console.log("Valid image selected. Preview URL created:", previewUrl);

    setNewEvent((prev) => ({
      ...prev,
      img: file,
      imgPreview: previewUrl,
      imgChanged: true,
    }));

    // Clear any previous image error
    setFormErrors((prev) => {
      const updated = { ...prev, img: "" };
      console.log("Cleared image error. Current formErrors:", updated);
      return updated;
    });
  };

  const validateForm = (): boolean => {
    // validateEventForm returns { isValid, errors }
    const result = validateEventForm(newEvent, editingEvent);
    setFormErrors(result.errors || {});
    return result.isValid;
  };

  // --- inside handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Step 1: Validate form ---
    const { isValid, errors } = validateEventForm(newEvent, editingEvent);
    if (!isValid) {
      setFormErrors(errors); // display inline form errors
      return;
    }

    setFormErrors({}); // clear previous errors
    setIsLoading(true);

    try {
      const formData = new FormData();

      // --- Basic event details ---
      ["eventName", "description", "subtitle", "eventOverview"].forEach(
        (field) => {
          const value = (newEvent as any)[field];
          if (value) formData.append(field, value);
        }
      );

      // --- Targets ---
      const targets = newEvent.community.map((c) => ({
        targetType: (c as any).type || "Community",
        targetId: (c as any).value,
      }));
      formData.append("targets", JSON.stringify(targets));

      // --- Access mode ---
      const backendAccessMode =
        newEvent.eventAccessType === "free-paid"
          ? "freepaid"
          : newEvent.eventAccessType;
      formData.append("accessMode", backendAccessMode);

      // --- Location data ---
      formData.append(
        "region",
        JSON.stringify(newEvent.region.map((r) => (r as any).value))
      );
      formData.append(
        "state",
        JSON.stringify(newEvent.state.map((s) => (s as any).label))
      );
      if (newEvent.country.length > 0) {
        formData.append(
          "country",
          JSON.stringify(newEvent.country.map((c) => (c as any).label))
        );
      }

      // --- Event times ---
      if (newEvent.eventType !== "tripevent") {
        if (newEvent.startTime)
          formData.append("startTime", newEvent.startTime);
        if (newEvent.endTime) formData.append("endTime", newEvent.endTime);
      }

      // --- Paid / Free flag ---
      const derivedIsPaid =
        newEvent.eventAccessType === "paid" ||
        newEvent.eventAccessType === "free-paid";
      formData.append("isPaid", String(derivedIsPaid));

      // --- Membership types ---
      formData.append(
        "membershipType",
        JSON.stringify(newEvent.membershipType.map((m) => (m as any).value))
      );

      // --- Membership access type ---
      let membershipAccessType: any[] = [];
      if (newEvent.eventAccessType === "free") {
        membershipAccessType = newEvent.freeMemberships.map((m) => ({
          membership: m,
          accessType: "free",
          type: "free",
        }));
      } else if (newEvent.eventAccessType === "paid") {
        membershipAccessType = newEvent.paidMemberships.map((m) => ({
          membership: m,
          accessType: "paid",
          type: "paid",
        }));
      } else if (newEvent.eventAccessType === "free-paid") {
        membershipAccessType = [
          ...newEvent.freeMemberships.map((m) => ({
            membership: m,
            accessType: "free",
            type: "free",
          })),
          ...newEvent.paidMemberships.map((m) => ({
            membership: m,
            accessType: "paid",
            type: "paid",
          })),
        ];
      }
      formData.append(
        "membershipAccessType",
        JSON.stringify(membershipAccessType)
      );

      // --- Event type specifics ---
      formData.append("eventType", newEvent.eventType);
      if (newEvent.eventType === "onedayevent") {
        formData.append("date", newEvent.date);
        formData.append("location", newEvent.location);
      } else if (newEvent.eventType === "onlineevent") {
        formData.append("date", newEvent.date);
        formData.append("onlineLink", newEvent.onlineLink);
      } else if (newEvent.eventType === "tripevent") {
        formData.append("startDate", newEvent.startDate);
        formData.append("endDate", newEvent.endDate);
        formData.append("location", newEvent.location);
      }

      // --- Payment amount ---
      if (derivedIsPaid) {
        formData.append("amount", newEvent.amount);
      }

      // --- Why attend ---
      newEvent.whyAttend
        .filter((r) => r.trim() !== "")
        .forEach((r) => formData.append("whyAttend[]", r));

      // --- Event image ---
      if (newEvent.imgChanged && newEvent.img instanceof File) {
        formData.append("img", newEvent.img);
      }

      // --- API call ---
      const response = editingEvent
        ? await api.put(`/events/event/edit/${editingEvent._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await api.post("/events/event/create", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (response.data.success) {
        toast.success(
          editingEvent
            ? "Event updated successfully!"
            : "Event created successfully!"
        );

        if (refreshEvents) refreshEvents();
        else setEvents(await fetchEvents({}));

        resetForm();
        setShowForm(false);
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error during form submission:", error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewEvent({
      ...DEFAULT_EVENT_STATE,
      eventAccessType: "free",
      freeMemberships: [],
      paidMemberships: [],
      // Reset community-specific free access fields (simplified - only cities and communities)
      communityFreeAccess: [],
      freeAccessCountries: [],
      freeAccessStates: [],
      freeAccessCities: [],
      freeAccessCommunities: [],
    });
    setEditingEvent(null);
    setIsDateDisabled(false);

    setFreeAccessCommunityOptions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (newEvent.imgPreview && newEvent.imgChanged) {
      URL.revokeObjectURL(newEvent.imgPreview);
    }
  };

  // 🧠 Common effect for create & edit modes — updates communities whenever location changes
  useEffect(() => {
    // Don’t run if nothing is selected yet
    if (
      newEvent.country.length === 0 &&
      newEvent.state.length === 0 &&
      newEvent.region.length === 0
    ) {
      return;
    }

    const updateCommunities = async () => {
      try {
        const countries = newEvent.country.map((c) => c.value);
        const states = newEvent.state.map((s) => s.value);
        const cities = newEvent.region.map((r) => r.value);

        const fetched = await fetchCommunities({ countries, states, cities });
        const communityOptions = fetched.map((c) => ({
          value: c._id,
          label: c.name,
        }));

        setNewEvent((prev) => ({
          ...prev,
          communityOptions,
          // If an old community still exists in new data, keep it selected
          community: prev.community.filter((selected) =>
            communityOptions.some((opt) => opt.value === selected.value)
          ),
        }));
      } catch (error) {
        console.error("Failed to fetch communities:", error);
        setNewEvent((prev) => ({
          ...prev,
          communityOptions: [],
        }));
      }
    };

    updateCommunities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newEvent.country, newEvent.state, newEvent.region]);

  const handleEdit = async (event: Event) => {
    console.log("🟦 Editing event:", event);

    // --- Image URL for preview ---
    const imageUrl = event.img ? `${SERVER_URL}/image/${event.img}` : null;
    console.log("📷 Image URL:", imageUrl);

    // --- Membership access parsing ---
    const membershipAccessType: MembershipAccess[] = Array.isArray(
      event.membershipAccessType
    )
      ? event.membershipAccessType
      : Object.entries(event.membershipAccessType || {}).map(
          ([membership, type]) => ({
            membership,
            accessType: type === "paid" ? "paid" : "free",
            type: type === "paid" ? "paid" : "free",
          })
        );
    console.log("🔑 Membership access type:", membershipAccessType);

    const freeTypes = membershipAccessType
      .filter((m) => m.type === "free")
      .map((m) => m.membership);
    const paidTypes = membershipAccessType
      .filter((m) => m.type === "paid")
      .map((m) => m.membership);

    let eventAccessType: EventAccessType = "free";
    if (freeTypes.length > 0 && paidTypes.length > 0)
      eventAccessType = "free-paid";
    else if (paidTypes.length > 0) eventAccessType = "paid";
    console.log("🎯 Event access type:", eventAccessType);

    // --- Location parsing safely ---
    let countriesRaw: string[] = [];
    try {
      if (typeof event.country === "string") {
        countriesRaw = JSON.parse(event.country);
      } else if (Array.isArray(event.country)) {
        countriesRaw = event.country;
      }
    } catch (err) {
      console.warn("⚠️ Failed to parse countries:", err);
      countriesRaw = [];
    }

    const statesRaw: string[] = Array.isArray(event.state) ? event.state : [];
    const regionsRaw: string[] = Array.isArray(event.region)
      ? event.region
      : [];

    // --- Dropdown-friendly data ---
    const countries: Option[] = countriesRaw.map((c: string) => ({
      value: Country.getAllCountries().find((x) => x.name === c)?.isoCode || c,
      label: c,
    }));
    console.log("🌍 Countries:", countries);

    const states: Option[] = statesRaw.map((s: string) => ({
      value: State.getAllStates().find((x) => x.name === s)?.isoCode || s,
      label: s,
    }));
    console.log("🏛️ States:", states);

    const regions: Option[] = regionsRaw.map((r: string) => ({
      value: r,
      label: r,
    }));
    console.log("🏙️ Regions:", regions);

    // --- Targets (communities) ---
    const targets = Array.isArray(event.targets) ? event.targets : [];
    const selectedCommunities: Option[] =
      targets.length > 0
        ? targets.map((t) => ({
            value: t.targetId,
            label: t.name || "Unnamed Community",
          }))
        : [];
    console.log("🏘️ Selected communities:", selectedCommunities);

    // --- Build state & city dropdowns ---
    const groupedStates: GroupedOption[] =
      countries.length > 0
        ? countries.map((country) => ({
            label: country.label,
            options: State.getStatesOfCountry(country.value).map((st) => ({
              value: st.isoCode,
              label: st.name,
            })),
          }))
        : [];
    setStateOptions(groupedStates);
    console.log("📌 Grouped states:", groupedStates);

    const groupedCities: GroupedOption[] =
      states.length > 0 && countries.length > 0
        ? states.map((state) => ({
            label: state.label,
            options: City.getCitiesOfState(countries[0].value, state.value).map(
              (city) => ({
                value: city.name,
                label: city.name,
              })
            ),
          }))
        : [];
    setCityOptions(groupedCities);
    console.log("📌 Grouped cities:", groupedCities);

    // --- Fetch communities for form dropdown ---
    let communityOptions: Option[] = [];
    try {
      const fetched = await fetchCommunities({
        countries: countries.map((c) => c.value),
        states: states.map((s) => s.value),
        cities: regions.map((r) => r.value),
      });
      communityOptions = fetched.map((c) => ({ value: c._id, label: c.name }));
      console.log("✅ Fetched community options:", communityOptions);
    } catch (err) {
      console.error("❌ Failed to fetch communities:", err);
      communityOptions = [];
    }

    // --- Pre-fill form ---
    const preFilledEventData: EventForm = {
      img: null,
      imgPreview: imageUrl,
      imgChanged: false,
      eventName: event.eventName || "",
      description: event.description || "",
      location: event.location || "",
      onlineLink: event.onlineLink || "",
      date: event.date ? formatDateForInput(event.date) : "",
      startDate: event.startDate ? formatDateForInput(event.startDate) : "",
      endDate: event.endDate ? formatDateForInput(event.endDate) : "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      country: countries,
      state: states,
      region: regions,
      community: selectedCommunities,
      communityOptions,
      subtitle: event.subtitle || "",
      eventOverview: event.eventOverview || "",
      whyAttend: Array.isArray(event.whyAttend)
        ? event.whyAttend
        : event.whyAttend
        ? [event.whyAttend]
        : [""],
      isPaid: event.isPaid || false,
      membershipType: Array.isArray(event.membershipType)
        ? event.membershipType.map((m) => ({ value: m, label: m }))
        : [],
      membershipAccessType,
      eventAccessType,
      freeMemberships: freeTypes,
      paidMemberships: paidTypes,
      amount: event.amount ? String(event.amount) : "",
      eventType: event.eventType,
      communityFreeAccess: [],
      freeAccessCountries: [],
      freeAccessStates: [],
      freeAccessCities: [],
      freeAccessCommunities: [],
    };

    setEditingEvent(event);
    setNewEvent(preFilledEventData);
    console.log("📝 Pre-filled event form:", preFilledEventData);

    // --- Disable past dates ---
    const eventDate =
      event.eventType === "tripevent"
        ? new Date(event.startDate || "")
        : new Date(event.date || "");
    setIsDateDisabled(eventDate <= new Date());
    setShowForm(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      setIsLoading(true);
      const response = await api.delete<ApiResponse<unknown>>(
        `/events/event/delete/${eventId}`
      );
      if (response.data.success) {
        toast.success("Event deleted successfully!");
        // Refresh the events list using external refresh function
        if (refreshEvents) {
          refreshEvents();
        } else {
          // Fallback: update our local events state
          setEvents((prev) => prev.filter((event) => event._id !== eventId));
        }
      } else {
        toast.error(response.data.message || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          "An error occurred while deleting the event"
      );
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    }
  };

  const confirmDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setShowDeleteConfirm(true);
  };

  const handleOpenParticipants = (event: Event) => {
    navigate(`/eventmembers/${event._id}`);
  };

  // Return all state and functions
  return {
    // State
    events,
    communities,
    isFetching,
    showForm,
    setShowForm,
    editingEvent,
    isLoading,
    isDateDisabled,
    showDeleteConfirm,
    setShowDeleteConfirm,
    eventToDelete,
    stateOptions,
    cityOptions,
    freeAccessStateOptions,
    freeAccessCityOptions,
    freeAccessCommunityOptions,
    newEvent,
    setNewEvent,
    countryOptions,
    fileInputRef,
    handleLocationChange,
    // Helper functions
    getLocationFieldLabels,
    getLocationPlaceholders,
    getLocationFieldVisibility,
    // Event handlers
    handleChange,
    handleImageUpload,
    validateForm,
    handleSubmit,
    resetForm,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleOpenParticipants,
    navigate,
    formErrors,
    setFormErrors,
  };
};

export default useEventManagement;
