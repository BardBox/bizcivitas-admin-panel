import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { City, State, Country } from "country-state-city";
import { MultiValue } from "react-select"; // Added for handleLocationChange
import api from "../api/api";
import { formatDateForInput } from "../utils/eventHelpers";
import { validateEventForm } from "../utils/eventValidation";
import { fetchCommunities } from "../api/eventApi";
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
import {
  SERVER_URL,
  MEMBERSHIP_OPTIONS,
  DEFAULT_EVENT_STATE,
} from "../constants/eventConstants";

interface UseEventFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const useEventForm = ({
  onSuccess,
  onCancel,
}: UseEventFormProps = {}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [newEvent, setNewEvent] = useState<EventForm>(DEFAULT_EVENT_STATE);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Added formErrors state

  // Location options state
  const [stateOptions, setStateOptions] = useState<GroupedOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GroupedOption[]>([]);
  const [freeAccessStateOptions, setFreeAccessStateOptions] = useState<GroupedOption[]>([]);
  const [freeAccessCityOptions, setFreeAccessCityOptions] = useState<GroupedOption[]>([]);
  const [freeAccessCommunityOptions, setFreeAccessCommunityOptions] = useState<Community[]>([]);

  // Main form communities state
  const [communities, setCommunities] = useState<Community[]>([]);

  // Country options
  const countryOptions: Option[] = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  // Handle cascading location changes (aligned with useEventManagement.ts)
  const handleLocationChange = (
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
  };

  // Country-state dependency effect
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
      // Fallback: If no country selected, show Indian states (backward compatibility)
      const indianStates = State.getStatesOfCountry("IN").map((state) => ({
        value: state.isoCode,
        label: state.name,
        country: "India",
      }));
      if (indianStates.length > 0) {
        setStateOptions([
          {
            label: "India (Default)",
            options: indianStates,
          },
        ]);
      } else {
        setStateOptions([]);
      }
      setNewEvent((prev) => ({ ...prev, state: [], region: [] }));
    }
  }, [newEvent.country]);

  // State-city dependency effect
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
  }, [newEvent.state, newEvent.country]);

  // Free access city options effect
  useEffect(() => {
    if (newEvent.state.length > 0 && newEvent.country.length > 0) {
      const countryCode = newEvent.country[0].value;
      const stateCode = newEvent.state[0].value;
      const countryData = Country.getAllCountries().find(
        (c) => c.isoCode === countryCode
      );
      const stateData = State.getStatesOfCountry(countryCode).find(
        (s) => s.isoCode === stateCode
      );
      const cities = City.getCitiesOfState(countryCode, stateCode).map(
        (city) => ({
          value: city.name,
          label: city.name,
          state: stateData?.name || "",
          country: countryData?.name || "",
        })
      );
      if (cities.length > 0) {
        setFreeAccessCityOptions([
          {
            label: `${stateData?.name || stateCode} (${
              countryData?.name || ""
            })`,
            options: cities,
          },
        ]);
      } else {
        setFreeAccessCityOptions([]);
      }
    } else {
      setFreeAccessCityOptions([]);
      setNewEvent((prev) => ({ ...prev, freeAccessCities: [] }));
    }
  }, [newEvent.country, newEvent.state]);

  // Free access communities fetching effect
  useEffect(() => {
    const fetchFreeAccessCommunities = async () => {
      if (newEvent.country.length === 0) {
        setFreeAccessCommunityOptions([]);
        return;
      }
      try {
        let communities: Community[] = [];
        let success = false;
        const params: Record<string, any> = {};
        if (newEvent.country.length > 0)
          params.country = newEvent.country[0].value;
        if (newEvent.state.length > 0) params.state = newEvent.state[0].value;
        if (newEvent.freeAccessCities.length > 0)
          params.city = newEvent.freeAccessCities[0];
        console.log(
          "🔄 Fetching communities for free access with params:",
          params
        );
        try {
          communities = await fetchCommunities({
            countries: [params.country],
            states: [params.state],
            cities: params.city ? [params.city] : [],
          });
          if (communities.length > 0) success = true;
        } catch (error) {
          console.warn("❌ Failed to fetch with full params");
        }
        if (!success) {
          try {
            communities = await fetchCommunities({
              countries: [params.country],
              states: [params.state],
              cities: [],
            });
            if (communities.length > 0) success = true;
          } catch (error) {
            console.warn("❌ Failed to fetch with country/state");
          }
        }
        if (!success) {
          try {
            communities = await fetchCommunities({
              countries: [params.country],
              states: [],
              cities: [],
            });
            success = true;
          } catch (error) {
            console.warn("❌ Failed to fetch with country only");
          }
        }
        setFreeAccessCommunityOptions(communities);
        console.log("✅ Free access communities fetched:", communities);
      } catch (error) {
        console.error("❌ Error fetching free access communities:", error);
        setFreeAccessCommunityOptions([]);
      }
    };
    fetchFreeAccessCommunities();
  }, [newEvent.country, newEvent.state, newEvent.freeAccessCities]);

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
            label: `Cities in ${stateName || stateCode} (${countryCode})`,
            options: cities.map((city) => ({
              value: city.name,
              label: city.name,
              state: stateName || stateCode,
              country: countryCode,
            })),
          });
        }
      });
    });
    setFreeAccessCityOptions(cityGroups);
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
      const hasAllCities = newEvent.region.some((r) => r.value === "ALL_CITIES");

      try {
        let communitiesList: Community[] = [];
        let success = false;

        const mapEntities = (data: any[]) =>
          data.map((entity) => ({
            _id: entity._id,
            name: entity.name || entity.communityName || "Unknown",
            status: entity.status || "active",
            type: entity.type || "Community",
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
          console.log("🏛️ Fetching communities for all states in selected countries");
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
          console.log("🏙️ Fetching communities for all cities in selected states");
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
          if (newEvent.region.length > 0) {
            const countries = newEvent.country.map((c) => c.value);
            const states = newEvent.state.map((s) => s.value);
            const cities = newEvent.region.map((r) => r.value);

            console.log("🔄 Fetching communities for multiple locations:", {
              countries,
              states,
              cities,
            });

            const fetched = await fetchCommunities({ countries, states, cities });
            communitiesList = fetched.map((c) => ({ ...c, type: c.type || "Community" }));
            success = communitiesList.length > 0;
          } else {
            const params: Record<string, any> = {};
            if (newEvent.country.length > 0) params.country = newEvent.country[0].value;
            if (newEvent.state.length > 0) params.state = newEvent.state[0].value;

            const endpoints = ["/meetings/entities", "/core-groups/", "/community/"];
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

        const uniqueCommunities = communitiesList.filter(
          (c, i, arr) => i === arr.findIndex((x) => x._id === c._id)
        );
        setCommunities(uniqueCommunities);
        console.log("✅ Communities loaded:", uniqueCommunities.length);
      } catch (error) {
        console.error("❌ Error fetching communities for form:", error);
        setCommunities([]);
      }
    };
    fetchCommunitiesForForm();
  }, [newEvent.country, newEvent.state, newEvent.region]);

  // Form handlers
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        toast.error("Image size exceeds 2MB. Please upload a smaller image.");
        setFormErrors((prev) => ({
          ...prev,
          img: "Image size exceeds 2MB.",
        }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setNewEvent((prev) => ({
        ...prev,
        img: file,
        imgPreview: previewUrl,
        imgChanged: true,
      }));
     // Clear img error on valid upload
setFormErrors((prev) => {
  const newErrors = { ...prev };
  delete newErrors.img;
  return newErrors;
});

    }
  };

  const validateForm = (): boolean => {
    const { isValid, errors } = validateEventForm(newEvent, editingEvent);
    setFormErrors(errors); // Set form errors for inline display
    if (!isValid) {
      // Show toasts for all errors
      Object.values(errors).forEach((error) => {
        toast.error(error);
      });
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Validate form
    const { isValid, errors } = validateEventForm(newEvent, editingEvent);
    setFormErrors(errors); // Set inline form errors
    if (!isValid) {
      // Show toasts for all errors
      Object.values(errors).forEach((error) => {
        toast.error(error);
      });
      console.log("🚫 Form validation failed:", errors);
      return;
    }

    setFormErrors({}); // Clear previous errors
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Basic event details
      ["eventName", "description", "subtitle", "eventOverview"].forEach(
        (field) => {
          const value = (newEvent as any)[field];
          if (value) formData.append(field, value);
        }
      );

      // Communities
      if (newEvent.community.length === 0) {
        formData.append("communities", "null");
      } else {
        formData.append(
          "communities",
          JSON.stringify(newEvent.community.map((c) => c.value))
        );
      }

      // Location data
      formData.append(
        "region",
        JSON.stringify(newEvent.region.map((r) => r.value))
      );
      formData.append(
        "state",
        JSON.stringify(newEvent.state.map((s) => s.value))
      );
      if (newEvent.country.length > 0) {
        formData.append(
          "country",
          JSON.stringify(newEvent.country.map((c) => c.value))
        );
      }

      // Event times
      if (
        newEvent.eventType !== "tripevent" ||
        (newEvent.eventType === "tripevent" && newEvent.startTime)
      ) {
        formData.append("startTime", newEvent.startTime);
      }
      if (
        newEvent.eventType !== "tripevent" ||
        (newEvent.eventType === "tripevent" && newEvent.endTime)
      ) {
        formData.append("endTime", newEvent.endTime);
      }

      // Paid / Free flag
      const derivedIsPaid =
        newEvent.eventAccessType === "paid" ||
        newEvent.eventAccessType === "free-paid";
      formData.append("isPaid", String(derivedIsPaid));

      // Membership types
      formData.append(
        "membershipType",
        JSON.stringify(newEvent.membershipType.map((m) => m.value))
      );

      // Membership access type
      let membershipAccessType: MembershipAccess[] = [];
      if (newEvent.eventAccessType === "free") {
        membershipAccessType = MEMBERSHIP_OPTIONS.map((membership) => ({
          membership: membership.value,
          accessType: "free" as const,
          type: "free" as const,
        }));
      } else if (newEvent.eventAccessType === "paid") {
        membershipAccessType = MEMBERSHIP_OPTIONS.map((membership) => ({
          membership: membership.value,
          accessType: "paid" as const,
          type: "paid" as const,
        }));
      } else if (newEvent.eventAccessType === "free-paid") {
        membershipAccessType = MEMBERSHIP_OPTIONS.map((membership) => ({
          membership: membership.value,
          accessType: newEvent.freeMemberships.includes(membership.value)
            ? ("free" as const)
            : ("paid" as const),
          type: newEvent.freeMemberships.includes(membership.value)
            ? ("free" as const)
            : ("paid" as const),
        }));
      }
      formData.append(
        "membershipAccessType",
        JSON.stringify(membershipAccessType)
      );

      // Free access communities
      if (newEvent.freeAccessCommunities.length > 0) {
        formData.append(
          "communityFreeAccess",
          JSON.stringify(
            newEvent.freeAccessCommunities.map((communityId) => ({
              communityId,
              freeAccessType: "community",
              countries: newEvent.freeAccessCountries,
              states: newEvent.freeAccessStates,
              cities: newEvent.freeAccessCities,
            }))
          )
        );
      }

      // Event type specifics
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

      // Payment amount
      if (derivedIsPaid) {
        formData.append("amount", newEvent.amount);
      }

      // Why attend
      newEvent.whyAttend
        .filter((reason) => reason.trim() !== "")
        .forEach((reason) => {
          formData.append("whyAttend", reason);
        });

      // Event image
      if (newEvent.imgChanged && newEvent.img instanceof File) {
        formData.append("img", newEvent.img);
      }

      // API call
      let response;
      if (editingEvent) {
        response = await api.put<ApiResponse<Event>>(
          `/events/event/edit/${editingEvent._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        response = await api.post<ApiResponse<{ _id: string }>>(
          "/events/event/create",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      if (response.data.success) {
        toast.success(
          editingEvent
            ? "Event updated successfully!"
            : "Event created successfully!"
        );
        resetForm();
        onSuccess?.();
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
      communityFreeAccess: [],
      freeAccessCountries: [],
      freeAccessStates: [],
      freeAccessCities: [],
      freeAccessCommunities: [],
      eventType: "onedayevent",
    });
    setEditingEvent(null);
    setIsDateDisabled(false);
    setFormErrors({}); // Clear form errors
    setFreeAccessCommunityOptions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (newEvent.imgPreview && newEvent.imgChanged) {
      URL.revokeObjectURL(newEvent.imgPreview);
    }
  };

  const handleEdit = (event: Event) => {
    const imageUrl = event.img ? `${SERVER_URL}/image/${event.img}` : null;
    let membershipAccessType: MembershipAccess[] = [];
    if (Array.isArray(event.membershipAccessType)) {
      membershipAccessType = event.membershipAccessType;
    } else {
      membershipAccessType = Object.entries(
        event.membershipAccessType || {}
      ).map(([membership, type]) => ({
        membership,
        accessType: type as "free" | "paid",
        type: type as "free" | "paid",
      }));
      MEMBERSHIP_OPTIONS.forEach((option) => {
        if (!membershipAccessType.find((m) => m.membership === option.value)) {
          membershipAccessType.push({
            membership: option.value,
            accessType: "free",
            type: "free",
          });
        }
      });
    }
    let eventAccessType: EventAccessType = "free";
    let freeMemberships: string[] = [];
    let paidMemberships: string[] = [];
    const freeTypes = membershipAccessType
      .filter((m) => m.type === "free")
      .map((m) => m.membership);
    const paidTypes = membershipAccessType
      .filter((m) => m.type === "paid")
      .map((m) => m.membership);
    if (freeTypes.length > 0 && paidTypes.length > 0) {
      eventAccessType = "free-paid";
      freeMemberships = freeTypes;
      paidMemberships = paidTypes;
    } else if (paidTypes.length > 0) {
      eventAccessType = "paid";
      paidMemberships = paidTypes;
    } else {
      eventAccessType = "free";
      freeMemberships = freeTypes;
    }

    // Map communities from targets array safely
    const rawTargets = (event as any).targets ?? (event as any).targetsArray ?? [];
    const communityOptions: Option[] = Array.isArray(rawTargets)
      ? rawTargets
          .filter((target: any) => target.targetType === "Community")
          .map((target: any) => ({
            value: target.targetId,
            label: target.name || target.communityName || String(target.targetId),
            type: target.targetType || "Community",
          }))
      : [];

    setEditingEvent(event);
    setNewEvent({
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
      community: communityOptions,
      region: (() => {
        if (Array.isArray(event.region)) {
          return event.region.map((r) => ({ value: r, label: r }));
        } else if (typeof event.region === "string") {
          try {
            const parsed = JSON.parse(event.region);
            return Array.isArray(parsed)
              ? parsed.map((r) => ({ value: r, label: r }))
              : [];
          } catch {
            return [{ value: event.region, label: event.region }];
          }
        }
        return [];
      })(),
      state: (() => {
        if (Array.isArray(event.state)) {
          return event.state.map((s) => {
            let stateData = null;
            const allCountries = Country.getAllCountries();
            for (const country of allCountries) {
              const states = State.getStatesOfCountry(country.isoCode);
              stateData = states.find(
                (state) => state.name === s || state.isoCode === s
              );
              if (stateData) break;
            }
            return {
              value: stateData?.isoCode || s,
              label: stateData?.name || s,
            };
          });
        } else if (typeof event.state === "string") {
          try {
            const parsed = JSON.parse(event.state);
            return Array.isArray(parsed)
              ? parsed.map((s) => {
                  let stateData = null;
                  const allCountries = Country.getAllCountries();
                  for (const country of allCountries) {
                    const states = State.getStatesOfCountry(country.isoCode);
                    stateData = states.find(
                      (state) => state.name === s || state.isoCode === s
                    );
                    if (stateData) break;
                  }
                  return {
                    value: stateData?.isoCode || s,
                    label: stateData?.name || s,
                  };
                })
              : [];
          } catch {
            return [{ value: event.state, label: event.state }];
          }
        }
        return [];
      })(),
      country: (() => {
        if (Array.isArray(event.country)) {
          return event.country.map((c) => {
            const countryData = Country.getAllCountries().find(
              (country) => country.name === c || country.isoCode === c
            );
            return {
              value: countryData?.isoCode || c,
              label: countryData?.name || c,
            };
          });
        } else if (typeof event.country === "string") {
          try {
            const parsed = JSON.parse(event.country);
            return Array.isArray(parsed)
              ? parsed.map((c) => {
                  const countryData = Country.getAllCountries().find(
                    (country) => country.name === c || country.isoCode === c
                  );
                  return {
                    value: countryData?.isoCode || c,
                    label: countryData?.name || c,
                  };
                })
              : (() => {
                  const countryString =
                    typeof event.country === "string" ? event.country : "";
                  const countryData = Country.getAllCountries().find(
                    (country) =>
                      country.name === countryString ||
                      country.isoCode === countryString
                  );
                  return [
                    {
                      value: countryData?.isoCode || countryString,
                      label: countryData?.name || countryString,
                    },
                  ];
                })();
          } catch {
            const countryString =
              typeof event.country === "string" ? event.country : "";
            const countryData = Country.getAllCountries().find(
              (country) =>
                country.name === countryString || country.isoCode === countryString
            );
            return [
              {
                value: countryData?.isoCode || countryString,
                label: countryData?.name || countryString,
              },
            ];
          }
        }
        return [];
      })(),
      subtitle: event.subtitle || "",
      eventOverview: event.eventOverview || "",
      whyAttend: (() => {
        if (Array.isArray(event.whyAttend) && event.whyAttend.length > 0) {
          return event.whyAttend;
        } else if (typeof event.whyAttend === "string") {
          try {
            const parsed = JSON.parse(event.whyAttend);
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : [""];
          } catch {
            return [event.whyAttend];
          }
        }
        return [""];
      })(),
      isPaid: event.isPaid || false,
      membershipType: Array.isArray(event.membershipType)
        ? event.membershipType.map((m) => ({ value: m, label: m }))
        : [],
      membershipAccessType,
      eventAccessType,
      freeMemberships,
      paidMemberships,
      communityFreeAccess: [],
      freeAccessCountries: [],
      freeAccessStates: [],
      freeAccessCities: [],
      freeAccessCommunities: [],
      amount: event.amount ? String(event.amount) : "",
      eventType: event.eventType,
    });
    setIsDateDisabled(
      event.eventType === "tripevent"
        ? new Date(event.startDate || "") <= new Date()
        : new Date(event.date || "") <= new Date()
    );
    setFormErrors({}); // Clear form errors on edit
  };

  const cancelForm = () => {
    resetForm();
    onCancel?.();
  };

  return {
    newEvent,
    setNewEvent,
    editingEvent,
    isLoading,
    isDateDisabled,
    fileInputRef,
    stateOptions,
    cityOptions,
    freeAccessStateOptions,
    freeAccessCityOptions,
    freeAccessCommunityOptions,
    countryOptions,
    communities,
    handleChange,
    handleImageUpload,
    handleLocationChange, // Added to support location changes
    validateForm,
    handleSubmit,
    resetForm,
    handleEdit,
    cancelForm,
    formErrors, // Added to return form errors
    setFormErrors, // Added to allow setting form errors
  };
};