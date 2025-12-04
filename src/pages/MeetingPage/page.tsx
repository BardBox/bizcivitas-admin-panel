import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVisibility } from "../../context/VisibilityContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";
import Select, { MultiValue, GroupBase } from "react-select";
import { Country, State, City } from "country-state-city";
import { FiPlus, FiX, FiTrash2 } from "react-icons/fi";
// import {
//   validateLocationData,
// } from "../../utils/locationUtils";

// Define extended location field visibility interface
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

// Update the Community interface to match the API response
interface Community {
  _id: string;
  name: string;
  communityName?: string;
  states?: string[];
  cities?: string[];
  type: "Community" | "CoreGroup";
}

interface Visitor {
  meetingId: string;
  visitorName: string;
  email: string;
  businessCategory?: string;
  businessSubcategory?: string;
  mobile: number | string;
  source: "invited" | "registered" | "community";
  fname: string;
  lname: string;
}

interface Meeting {
  _id: string;
  title: string;
  visitor: string;
  speaker: string;
  community: Community | null;
  agenda: string;
  date: string;
  place: string;
  time: string;
  img: string;
  visitorFee: number;
  allVisitors: Visitor[];
  invitedVisitors: Visitor[];
  registeredUsers: string[];
}

interface Option {
  value: string;
  label: string;
  country?: string;
  state?: string;
}

interface GroupedOption extends GroupBase<Option> {
  label: string;
  options: Option[];
}

interface FormData {
  title: string;
  visitor: string;
  speaker: string;
  agenda: string;
  date: string;
  place: string;
  time: string;
  img: File | null;
  visitorFee: number;
  country: MultiValue<Option>;
  state: MultiValue<Option>;
  city: MultiValue<Option>;
  targetId: MultiValue<Option>;
  targetType: "Community" | "CoreGroup" | "";
}

const MeetingPage = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    visitor: "",
    speaker: "",
    agenda: "",
    date: "",
    place: "",
    time: "",
    img: null,
    visitorFee: 0,
    country: [],
    state: [],
    city: [],
    targetId: [],
    targetType: "",
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [entities, setEntities] = useState<Community[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<GroupedOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GroupedOption[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterCommunity, setFilterCommunity] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max image size

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "42px",
      borderColor: "#e5e7eb",
      "&:hover": {
        borderColor: "#3b82f6",
      },
      "&:focus-within": {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
      },
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: "#eff6ff",
      border: "1px solid #3b82f6",
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: "#1d4ed8",
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: "#1d4ed8",
      "&:hover": {
        backgroundColor: "#3b82f6",
        color: "white",
      },
    }),
    groupHeading: (base: any) => ({
      ...base,
      backgroundColor: "#f3f4f6",
      color: "#374151",
      fontWeight: "600",
      fontSize: "14px",
      padding: "8px 12px",
      margin: "0",
      borderBottom: "1px solid #e5e7eb",
      textTransform: "none" as const,
    }),
    group: (base: any) => ({
      ...base,
      paddingTop: "0",
      paddingBottom: "0",
    }),
  };

  // Helper function to get location field visibility
  const getLocationFieldVisibility = (countries: string[]): LocationFieldVisibility => {
    // Check if any of the selected countries have states
    const hasStates = countries.some(countryCode => {
      const states = State.getStatesOfCountry(countryCode);
      return states && states.length > 0;
    });

    // Check if any of the selected countries have cities
    const hasCities = countries.some(countryCode => {
      const states = State.getStatesOfCountry(countryCode);
      return states.some(state => {
        const cities = City.getCitiesOfState(countryCode, state.isoCode);
        return cities && cities.length > 0;
      });
    });

    return {
      showCountry: true,
      showState: hasStates,
      showCity: hasCities,
      showCommunity: false,
      disableState: !hasStates,
      disableCity: !hasCities,
      disableCommunity: true,
      showStateField: hasStates,
      showCityField: hasCities,
    };
  };

  // Helper function to get location field labels
  const getLocationFieldLabels = (countries: string[], states: string[] = []) => {
    const countryNames = countries.map(countryCode => {
      const country = Country.getAllCountries().find(c => c.isoCode === countryCode);
      return country ? country.name : countryCode;
    });

    const stateNames = states.map(stateCode => {
      const state = State.getAllStates().find(s => s.isoCode === stateCode);
      return state ? state.name : stateCode;
    });

    return {
      countryLabel: countryNames.length === 1 ? `Country` : `Countries (${countryNames.length})`,
      stateLabel: stateNames.length === 1 ? `State` : `States (${stateNames.length})`,
      cityLabel: `Cities`,
    };
  };

  // Helper function to get location placeholders
const getLocationPlaceholders = (countries: string[]) => {
  return {
    countryPlaceholder: countries.length > 1 ? "Select Countries" : "Select Country",
    statePlaceholder: "Select State",
    cityPlaceholder: "Select City",
  };
};

  // Initialize country options
  useEffect(() => {
    const countries = Country.getAllCountries();
    const options = countries.map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountryOptions(options);
  }, []);

  // Update state options when countries change
  useEffect(() => {
    if (formData.country.length > 0) {
      const allStates: GroupedOption[] = [];
      formData.country.forEach((selectedCountry) => {
        const states = State.getStatesOfCountry(selectedCountry.value);
        const stateOptions = states.map((state) => ({
          value: state.isoCode,
          label: state.name,
          country: selectedCountry.label,
        }));
        if (stateOptions.length > 0) {
          // Add "All" option at the beginning
          const allOption: Option = {
            value: `__ALL__${selectedCountry.value}`,
            label: "All States",
            country: selectedCountry.label,
          };
          allStates.push({
            label: selectedCountry.label,
            options: [allOption, ...stateOptions],
          });
        }
      });
      setStateOptions(allStates);
    } else {
      setStateOptions([]);
      setFormData((prev) => ({ ...prev, state: [], city: [] }));
    }
  }, [formData.country]);

  // Update city options when states change
  useEffect(() => {
    if (formData.state.length > 0) {
      const allCities: GroupedOption[] = [];
      formData.state.forEach((selectedState) => {
        const country = formData.country.find((c) => c.label === selectedState.country);
        if (country) {
          const cities = City.getCitiesOfState(country.value, selectedState.value);
          const cityOptions = cities.map((city) => ({
            value: city.name,
            label: city.name,
            state: selectedState.label,
            country: selectedState.country,
          }));
          if (cityOptions.length > 0) {
            // Add "All" option at the beginning
            const allOption: Option = {
              value: `__ALL__${selectedState.value}__${country.value}`,
              label: "All Cities",
              state: selectedState.label,
              country: selectedState.country,
            };
            allCities.push({
              label: `${selectedState.label}, ${selectedState.country}`,
              options: [allOption, ...cityOptions],
            });
          }
        }
      });
      setCityOptions(allCities);
    } else {
      setCityOptions([]);
      setFormData((prev) => ({ ...prev, city: [] }));
    }
  }, [formData.state]);

  // Fetch entities for countries that don't have states/cities
  useEffect(() => {
    if (
      formData.country.length > 0 &&
      formData.state.length === 0 &&
      formData.city.length === 0
    ) {
      // Check if the selected countries have states/cities available
      const hasStatesOrCities = formData.country.some((country) => {
        const visibility = getLocationFieldVisibility([country.value]);
        return visibility.showStateField || visibility.showCityField;
      });

      // If country doesn't have states/cities, fetch entities directly by country
      if (!hasStatesOrCities) {
        const firstCountry = formData.country[0];
        fetchEntities({ country: firstCountry.value });
      }
    }
  }, [formData.country, formData.state, formData.city]);

  // Fetch meetings on component mount
  useEffect(() => {
    const fetchMeetings = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await api.get("/meetings");
        console.log("📡 Raw meetings response:", response.data);
        if (response.data.success) {
          const validMeetings = response.data.data
            .filter((meeting: any) => meeting && meeting._id)
            .map(async (meeting: any) => {
              console.log(
                "🔍 Processing meeting:",
                meeting.title,
                "Raw meeting data:",
                {
                  community: meeting.community,
                  targets: meeting.targets,
                }
              );

              // Handle both old and new meeting structures
              let safeCommunity: Community;
              if (meeting.targets && meeting.targets.length > 0) {
                // New structure: use targets array - fetch actual community data
                const target = meeting.targets[0];
                try {
                  // Try to fetch the specific community/group data
                  console.log(
                    "🔍 Fetching entity data for targetId:",
                    target.targetId,
                    "targetType:",
                    target.targetType
                  );

                  // Use specific endpoint based on targetType
                  let apiAttempts = [];
                  if (target.targetType === "CoreGroup") {
                    apiAttempts = [
                      `/core-groups/${target.targetId}`,
                      `/meetings/entities?targetId=${target.targetId}`,
                      `/community/${target.targetId}`, // Final fallback
                    ];
                  } else {
                    apiAttempts = [
                      `/meetings/entities?targetId=${target.targetId}`,
                      `/community/${target.targetId}`,
                      `/core-groups/${target.targetId}`, // In case targetType is wrong
                    ];
                  }

                  let communityResponse = null;
                  for (const apiUrl of apiAttempts) {
                    try {
                      console.log(`🔄 Trying API: ${apiUrl}`);
                      communityResponse = await api.get(apiUrl);
                      console.log(
                        `✅ Success with ${apiUrl}:`,
                        communityResponse.data
                      );
                      break; // Exit loop on success
                    } catch (error) {
                      console.warn(`❌ Failed ${apiUrl}:`, error);
                      continue; // Try next endpoint
                    }
                  }

                  if (communityResponse && communityResponse.data.success) {
                    let communityData;
                    // Handle different response structures
                    if (Array.isArray(communityResponse.data.data)) {
                      // Find the exact entity by ID
                      communityData = communityResponse.data.data.find(
                        (entity: any) => entity._id === target.targetId
                      );
                      if (
                        !communityData &&
                        communityResponse.data.data.length > 0
                      ) {
                        communityData = communityResponse.data.data[0]; // Fallback to first
                        console.warn(
                          "⚠️ Exact match not found, using first entity:",
                          communityData
                        );
                      }
                    } else {
                      // Direct entity fetch returns single object
                      communityData = communityResponse.data.data;
                    }

                    console.log("✅ Selected community data:", communityData);
                    if (communityData) {
                      safeCommunity = {
                        _id: target.targetId,
                        name:
                          communityData.name ||
                          communityData.communityName ||
                          "Unknown Community",
                        communityName: communityData.communityName,
                        states: communityData.states || [],
                        cities: communityData.cities || [],
                        type:
                          (target.targetType as "Community" | "CoreGroup") ||
                          "Community",
                      };
                      console.log("✅ Final safeCommunity:", safeCommunity);
                    } else {
                      // Fallback if no community data found
                      safeCommunity = {
                        _id: target.targetId,
                        name: `${target.targetType} ID: ${target.targetId.slice(
                          -8
                        )}`,
                        communityName: undefined,
                        states: [],
                        cities: [],
                        type:
                          (target.targetType as "Community" | "CoreGroup") ||
                          "Community",
                      };
                      console.warn(
                        "⚠️ No community data found, using fallback:",
                        safeCommunity
                      );
                    }
                  } else {
                    // Fallback if API call fails
                    safeCommunity = {
                      _id: target.targetId,
                      name: `${target.targetType} (API Failed)`,
                      communityName: undefined,
                      states: [],
                      cities: [],
                      type:
                        (target.targetType as "Community" | "CoreGroup") ||
                        "Community",
                    };
                    console.error(
                      "❌ API call failed for entity:",
                      target.targetId
                    );
                  }
                } catch (error) {
                  console.error("❌ Error fetching community:", error);
                  // Fallback if API call fails
                  safeCommunity = {
                    _id: target.targetId,
                    name: `${target.targetType} (Error)`,
                    communityName: undefined,
                    states: [],
                    cities: [],
                    type:
                      (target.targetType as "Community" | "CoreGroup") ||
                      "Community",
                  };
                }
              } else if (meeting.community) {
                // Old structure: check if community is populated object or just ID
                if (typeof meeting.community === "string") {
                  safeCommunity = {
                    _id: meeting.community,
                    name: "Community (ID Only)",
                    communityName: undefined,
                    states: [],
                    cities: [],
                    type: "Community",
                  };
                  console.log("✅ Using community ID:", safeCommunity);
                } else {
                  // Community is populated object
                  const communityData = meeting.community;
                  safeCommunity = {
                    _id: communityData._id || "",
                    name:
                      communityData.name ||
                      communityData.communityName ||
                      "Unknown",
                    communityName: communityData.communityName,
                    states: communityData.states || [],
                    cities: communityData.cities || [],
                    type:
                      (communityData.type as "Community" | "CoreGroup") ||
                      "Community",
                  };
                  console.log("✅ Using populated community:", safeCommunity);
                }
              } else {
                // No community or targets
                safeCommunity = {
                  _id: "",
                  name: "No Community",
                  communityName: undefined,
                  states: [],
                  cities: [],
                  type: "Community",
                };
                console.log("✅ No community/targets found");
              }

              return {
                ...meeting,
                community: safeCommunity,
                allVisitors:
                  meeting.allVisitors || meeting.communityVisitors || [],
                invitedVisitors: meeting.invitedVisitors || [],
                registeredUsers: meeting.registeredUsers || [],
              } as Meeting;
            });

          // Wait for all async operations to complete
          const resolvedMeetings = await Promise.all(validMeetings);
          setMeetings(resolvedMeetings);
        } else {
          toast.error(response.data.message || "Failed to fetch meetings.");
        }
      } catch (error) {
        console.error("Fetch meetings error:", error);
        toast.error("Failed to fetch meetings.");
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchMeetings();
  }, []);

  const fetchEntities = async (filters: {
    country?: string | string[];
    state?: string | string[];
    city?: string | string[];
  }) => {
    setIsLoading(true); // Start loading
    try {
      console.log("🔍 fetchEntities called with filters:", filters);

      // If multiple cities are provided, fetch entities for each city and combine results
      if (Array.isArray(filters.city) && filters.city.length > 0) {
        const uniqueEntities = new Map<string, Community>();

        // Fetch entities for each city
        for (const city of filters.city) {
          try {
            const queryParams = new URLSearchParams();
            if (filters.country && !Array.isArray(filters.country)) {
              queryParams.append("country", filters.country);
            }
            if (filters.state && !Array.isArray(filters.state)) {
              queryParams.append("state", filters.state);
            }
            queryParams.append("city", city);

            const apiUrl = `/meetings/entities?${queryParams.toString()}`;
            console.log("📡 API URL for city", city, ":", apiUrl);

            const response = await api.get(apiUrl);
            console.log("📥 API Response for city", city, ":", response.data);

            if (response.data.success && response.data.data) {
              // Add entities to our unique map to avoid duplicates
              response.data.data.forEach((entity: any) => {
                if (entity && entity._id && !uniqueEntities.has(entity._id)) {
                  const mappedEntity: Community = {
                    _id: entity._id,
                    name: entity.name || entity.communityName || "Unknown",
                    communityName: entity.communityName,
                    states: entity.states || [],
                    cities: entity.cities || [],
                    type:
                      (entity.type as "Community" | "CoreGroup") || "Community",
                  };
                  uniqueEntities.set(entity._id, mappedEntity);
                }
              });
            }
          } catch (cityError) {
            console.error(
              `Error fetching entities for city ${city}:`,
              cityError
            );
          }
        }

        // Convert map values to array
        const combinedEntities = Array.from(uniqueEntities.values());
        console.log("✅ Combined entities from all cities:", combinedEntities);
        setEntities(combinedEntities);
        return;
      }

      // Single city or no city - original logic
      const queryParams = new URLSearchParams();
      if (filters.country && !Array.isArray(filters.country)) {
        queryParams.append("country", filters.country);
      }
      if (filters.state && !Array.isArray(filters.state)) {
        queryParams.append("state", filters.state);
      }
      if (filters.city && !Array.isArray(filters.city)) {
        queryParams.append("city", filters.city);
      }

      const apiUrl = `/meetings/entities?${queryParams.toString()}`;
      console.log("📡 API URL:", apiUrl);

      const response = await api.get(apiUrl);
      console.log("📥 API Response:", response.data);

      if (response.data.success) {
        // Map API response to match Community interface with fallbacks
        const mappedEntities: Community[] = response.data.data
          .filter((entity: any) => entity && entity._id) // Filter invalid entities
          .map((entity: any) => ({
            _id: entity._id,
            name: entity.name || entity.communityName || "Unknown",
            communityName: entity.communityName, // Preserve if present
            states: entity.states || [],
            cities: entity.cities || [],
            type: (entity.type as "Community" | "CoreGroup") || "Community",
          }));

        console.log("✅ Mapped entities:", mappedEntities);
        setEntities(mappedEntities);
      } else {
        setEntities([]);
        toast.error(response.data.message || "Failed to fetch entities.");
      }
    } catch (error) {
      console.error("Fetch entities error:", error);
      setEntities([]);
      toast.error("Failed to fetch entities.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  // Fetch all entities on component mount
  useEffect(() => {
    const fetchAllEntities = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await api.get("/meetings/entities");
        if (response.data.success) {
          const mappedEntities: Community[] = response.data.data
            .filter((entity: any) => entity && entity._id)
            .map((entity: any) => ({
              _id: entity._id,
              name: entity.name || entity.communityName || "Unknown",
              communityName: entity.communityName,
              states: entity.states || [],
              cities: entity.cities || [],
              type: (entity.type as "Community" | "CoreGroup") || "Community",
            }));
          setEntities(mappedEntities);
        }
      } catch (error) {
        console.error("Error fetching all entities:", error);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };
    fetchAllEntities();
  }, []);

  // Helper function to safely get community name
  const getCommunityName = (
    community: Community | null | undefined
  ): string => {
    console.log("🔍 getCommunityName called with:", community);
    if (!community) return "Unknown";
    // Try multiple possible property names
    const name =
      community.name ||
      community.communityName ||
      (community as any).title ||
      (community as any).communityTitle ||
      "Unknown";
    console.log("✅ Resolved community name:", name);
    return name;
  };

  // Helper function to safely get community type
  const getCommunityType = (
    community: Community | null | undefined
  ): string => {
    console.log("🔍 getCommunityType called with:", community);
    if (!community) return "Unknown";
    const type =
      community.type || (community as any).communityType || "Community";
    console.log("✅ Resolved community type:", type);
    return type;
  };

  // Helper function to group entities by cities for the dropdown
  const getGroupedEntityOptions = (): GroupedOption[] => {
    const selectedCities = formData.city.map((city) => city.label);
    const selectedCountries = formData.country.map((country) => country.value);
    const groups: { [key: string]: Option[] } = {};

    entities
      .filter((entity) => entity && entity._id)
      .forEach((entity) => {
        // For countries without cities, show all entities from that country
        if (selectedCities.length === 0 && selectedCountries.length > 0) {
          const groupKey = `All ${selectedCountries
            .map(
              (c) => countryOptions.find((opt) => opt.value === c)?.label || c
            )
            .join(", ")}`;

          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }

          groups[groupKey].push({
            value: entity._id,
            label: `${getCommunityName(entity)} (${getCommunityType(entity)})`,
          });
        } else {
          // Original logic for countries with cities
          const entityCities = entity.cities || [];
          // Find intersection between selected cities and entity cities
          const relevantCities = selectedCities.filter((city) =>
            entityCities.includes(city)
          );
          // If no specific cities match, check if entity covers broader areas
          const citiesToShow =
            relevantCities.length > 0 ? relevantCities : selectedCities;

          citiesToShow.forEach((city) => {
            if (!groups[city]) {
              groups[city] = [];
            }

            groups[city].push({
              value: entity._id,
              label: `${getCommunityName(entity)} (${getCommunityType(
                entity
              )})`,
            });
          });
        }
      });

    // Convert groups object to GroupedOption array
    return Object.keys(groups).map((city) => ({
      label: city,
      options: groups[city],
    }));
  };

  // Handle sidebar visibility
  useEffect(() => {
    setSidebarAndHeaderVisibility(!isModalOpen);
  }, [isModalOpen, setSidebarAndHeaderVisibility]);

  // Open modal for creating/editing meeting
  const openModal = (meeting: Meeting | null = null) => {
    if (meeting) {
      // Extract states and cities from community data
      const communityStates = meeting.community?.states || [];
      const communityCities = meeting.community?.cities || [];

      console.log("📍 Community data for edit:", {
        states: communityStates,
        cities: communityCities,
        community: meeting.community,
      });

      // Try to determine the country from available data
      let detectedCountry = { value: "IN", label: "India" }; // Default fallback

      // If no states or cities, this might be a country without subdivisions
      if (communityStates.length === 0 && communityCities.length === 0) {
        // Try to infer country from community name
        const communityName = meeting.community?.name?.toLowerCase() || "";
        if (
          communityName.includes("iceland") ||
          communityName.includes("aland")
        ) {
          detectedCountry = { value: "AX", label: "Aland Islands" };
        } else if (communityName.includes("singapore")) {
          detectedCountry = { value: "SG", label: "Singapore" };
        } else if (communityName.includes("vatican")) {
          detectedCountry = { value: "VA", label: "Vatican City" };
        } else if (communityName.includes("monaco")) {
          detectedCountry = { value: "MC", label: "Monaco" };
        }
        // Add more country detection logic as needed
        console.log(
          "🔍 Detected country from community name:",
          detectedCountry
        );
      }

      // Convert to select options format
      const stateOptions = communityStates.map((stateCode) => {
        // Try to find the state by code in the detected country
        const countryStates = State.getStatesOfCountry(detectedCountry.value);
        const foundState = countryStates.find(
          (s) => s.isoCode === stateCode || s.name === stateCode
        );

        return foundState
          ? {
              value: foundState.isoCode,
              label: foundState.name,
              country: detectedCountry.label,
            }
          : {
              value: stateCode,
              label: stateCode,
              country: detectedCountry.label,
            };
      });

      const cityOptions = communityCities.map((cityName) => ({
        value: cityName,
        label: cityName,
        state: stateOptions[0]?.label || "",
        country: detectedCountry.label,
      }));

      console.log("📍 Converted options:", {
        detectedCountry,
        stateOptions,
        cityOptions,
      });

      setFormData({
        title: meeting.title || "",
        visitor: meeting.visitor || "",
        speaker: meeting.speaker || "",
        agenda: meeting.agenda || "",
        date: meeting.date
          ? new Date(meeting.date).toISOString().split("T")[0]
          : "",
        place: meeting.place || "",
        time: meeting.time || "",
        img: null,
        visitorFee: meeting.visitorFee || 0,
        country: [detectedCountry],
        state: stateOptions,
        city: cityOptions,
        targetId: meeting.community?._id
          ? [
              {
                value: meeting.community._id,
                label: `${meeting.community.name} (${meeting.community.type})`,
              },
            ]
          : [],
        targetType:
          (meeting.community?.type as "Community" | "CoreGroup") || "",
      });

      // Set state and city options in the dropdowns
      if (stateOptions.length > 0) {
        // Create grouped state options for the dropdown
        const groupedStates = [
          {
            label: "India",
            options: stateOptions,
          },
        ];
        setStateOptions(groupedStates);

        // Create grouped city options for the dropdown
        if (cityOptions.length > 0) {
          const groupedCities = stateOptions
            .map((state) => ({
              label: `${state.label}, India`,
              options: cityOptions.filter((city) =>
                // Filter cities that belong to this state (simplified logic)
                communityCities.includes(city.value)
              ),
            }))
            .filter((group) => group.options.length > 0);

          setCityOptions(groupedCities);
        }
      }

      setImagePreview(
        meeting.img
          ? `${import.meta.env.VITE_API_BASE_URL}/image/${meeting.img}`
          : null
      );
      setSelectedMeeting(meeting);

      if (meeting.community?._id) {
        fetchEntities({
          country: "IN",
          state: communityStates.length > 0 ? communityStates : undefined,
          city: communityCities.length > 0 ? communityCities : undefined,
        });
      }
    } else {
      // Reset form for new meeting
      setFormData({
        title: "",
        visitor: "",
        speaker: "",
        agenda: "",
        date: "",
        place: "",
        time: "",
        img: null,
        visitorFee: 0,
        country: [],
        state: [],
        city: [],
        targetId: [],
        targetType: "",
      });
      setImagePreview(null);
      setSelectedMeeting(null);
      setEntities([]);
      // Reset dropdown options
      setStateOptions([]);
      setCityOptions([]);
    }
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "visitorFee" ? parseFloat(value) || 0 : value,
    }));
  };

  // Handle country selection change
  const handleCountryChange = (selectedOptions: MultiValue<Option>) => {
    setFormData((prev) => ({
      ...prev,
      country: selectedOptions || [],
      state: [],
      city: [],
      targetId: [],
      targetType: "",
    }));
    setEntities([]);

    // Fetch entities when countries are selected
    if (selectedOptions && selectedOptions.length > 0) {
      // For the API, we'll use the first selected country
      const firstCountry = selectedOptions[0];
      fetchEntities({ country: firstCountry.value });
    }
  };

  // Handle state selection change
  const handleStateChange = (selectedOptions: MultiValue<Option>) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFormData((prev) => ({
        ...prev,
        state: [],
        city: [],
        targetId: [],
        targetType: "",
      }));
      setEntities([]);
      return;
    }

    // Check if "All" option is selected
    const allOptions = selectedOptions.filter((opt) => opt.value.startsWith("__ALL__"));
    
    if (allOptions.length > 0) {
      // If "All" is selected, replace it with all available states
      const allStates: Option[] = [];
      stateOptions.forEach((group) => {
        // Filter out the "All" option itself
        const regularStates = group.options.filter((opt) => !opt.value.startsWith("__ALL__"));
        allStates.push(...regularStates);
      });
      
      setFormData((prev) => ({
        ...prev,
        state: allStates,
        city: [],
        targetId: [],
        targetType: "",
      }));
      setEntities([]);

      // Fetch entities for all states
      if (formData.country.length > 0) {
        const firstCountry = formData.country[0];
        // Fetch entities without state filter to get all entities for the country
        fetchEntities({
          country: firstCountry.value,
        });
      }
    } else {
      // Normal selection - no "All" option
      setFormData((prev) => ({
        ...prev,
        state: selectedOptions,
        city: [],
        targetId: [],
        targetType: "",
      }));
      setEntities([]);

      // Fetch entities when states are selected (even without cities)
      if (formData.country.length > 0) {
        const firstCountry = formData.country[0];
        const firstState = selectedOptions[0];
        fetchEntities({
          country: firstCountry.value,
          state: firstState.value,
          // Don't pass city so we get all entities for the state
        });
      }
    }
  };

  // Handle city selection change
  const handleCityChange = (selectedOptions: MultiValue<Option>) => {
    if (!selectedOptions || selectedOptions.length === 0) {
      setFormData((prev) => ({
        ...prev,
        city: [],
        targetId: [],
        targetType: "",
      }));
      setEntities([]);
      return;
    }

    // Check if "All" option is selected
    const allOptions = selectedOptions.filter((opt) => opt.value.startsWith("__ALL__"));
    
    if (allOptions.length > 0) {
      // If "All" is selected, replace it with all available cities
      const allCities: Option[] = [];
      cityOptions.forEach((group) => {
        // Filter out the "All" option itself
        const regularCities = group.options.filter((opt) => !opt.value.startsWith("__ALL__"));
        allCities.push(...regularCities);
      });
      
      setFormData((prev) => ({
        ...prev,
        city: allCities,
        targetId: [],
        targetType: "",
      }));
      setEntities([]);

      // Fetch entities for all cities
      if (formData.country.length > 0 && formData.state.length > 0) {
        const firstCountry = formData.country[0];
        const firstState = formData.state[0];
        const selectedCities = allCities.map((city) => city.value);
        fetchEntities({
          country: firstCountry.value,
          state: firstState.value,
          city: selectedCities,
        });
      }
    } else {
      // Normal selection - no "All" option
      setFormData((prev) => ({
        ...prev,
        city: selectedOptions,
        targetId: [],
        targetType: "",
      }));
      setEntities([]);

      // Fetch entities when cities are selected
      if (formData.country.length > 0 && formData.state.length > 0) {
        const firstCountry = formData.country[0];
        const firstState = formData.state[0];
        const selectedCities = selectedOptions.map((city) => city.value);
        fetchEntities({
          country: firstCountry.value,
          state: firstState.value,
          city: selectedCities, // Pass array of cities
        });
      }
    }
  };

  // Handle entity selection change
  const handleEntityChange = (selectedEntities: MultiValue<Option>) => {
    setFormData((prev) => ({
      ...prev,
      targetId: selectedEntities,
      targetType: selectedEntities.length > 0 ? "Community" : "",
    }));
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size exceeds 2MB. Please upload a smaller image.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, img: file }));
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced form validation with specific field messages
    const validationErrors: string[] = [];

    // Check required fields individually
    if (!formData.title) validationErrors.push("Meeting title");
    if (!formData.agenda) validationErrors.push("Meeting agenda");
    if (!formData.date) validationErrors.push("Meeting date");
    if (!formData.place) validationErrors.push("Meeting location");
    if (!formData.time) validationErrors.push("Meeting time");
    if (formData.country.length === 0) validationErrors.push("Country");

    // Check location fields based on visibility
    const visibility = getLocationFieldVisibility(
      formData.country.map((c) => c.value)
    );

    if (visibility.showStateField && formData.state.length === 0) {
      validationErrors.push("State");
    }

    if (visibility.showCityField && formData.city.length === 0) {
      validationErrors.push("City");
    }

    if (formData.targetId.length === 0) validationErrors.push("Community");

    // Show validation errors in a single toast
    if (validationErrors.length > 0) {
      const errorMessage =
        validationErrors.length === 1
          ? `Please fill in: ${validationErrors[0]}`
          : `Please fill in the following fields: ${validationErrors.join(
              ", "
            )}`;
      toast.error(errorMessage);
      return;
    }

    // // Universal location validation
    // const locationValidation = validateLocationData({
    //   countries: formData.country.map((c) => c.value),
    //   states: formData.state.map((s) => s.value),
    //   cities: formData.city.map((c) => c.value),
    // });

    // if (!locationValidation.isValid) {
    //   const errorMessages = Object.values(locationValidation.errors);
    //   toast.error(errorMessages.join(", "));
    //   return;
    // }

    if (!selectedMeeting && !formData.img) {
      toast.error("Please upload an image for the meeting");
      return;
    }

    const selectedDate = new Date(formData.date);
    const selectedTime = formData.time.split(":").map(Number);
    selectedDate.setHours(selectedTime[0], selectedTime[1], 0, 0);

    if (selectedDate <= new Date()) {
      toast.error("Meeting date and time must be in the future");
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("visitor", formData.visitor);
      formDataToSend.append("speaker", formData.speaker);
      formDataToSend.append("agenda", formData.agenda);
      formDataToSend.append("date", selectedDate.toISOString());
      formDataToSend.append("place", formData.place);
      formDataToSend.append("time", formData.time);
      formDataToSend.append("visitorFee", formData.visitorFee.toString());

      // Add country, state, city data for API compatibility
      if (formData.country.length > 0) {
        formDataToSend.append(
          "country",
          JSON.stringify(formData.country.map((c) => c.value))
        );
      }

      if (formData.state.length > 0) {
        // Filter out "__ALL__" options if any remain
        const validStates = formData.state
          .filter((s) => !s.value.startsWith("__ALL__"))
          .map((s) => s.value);
        if (validStates.length > 0) {
          formDataToSend.append("state", JSON.stringify(validStates));
        }
      }

      if (formData.city.length > 0) {
        // Filter out "__ALL__" options if any remain
        const validCities = formData.city
          .filter((c) => !c.value.startsWith("__ALL__"))
          .map((c) => c.value);
        if (validCities.length > 0) {
          formDataToSend.append("city", JSON.stringify(validCities));
        }
      }

      // Build targets array with correct entity types
      const validTargets = formData.targetId
        .filter((selectedEntity) => {
          const entityExists = entities.find(
            (e) => e._id === selectedEntity.value
          );
          if (!entityExists) {
            console.warn(
              `Entity ${selectedEntity.value} not found in entities array`
            );
            return false;
          }
          return true;
        })
        .map((selectedEntity) => {
          const entityData = entities.find(
            (e) => e._id === selectedEntity.value
          );
          return {
            targetId: selectedEntity.value,
            targetType: entityData?.type || "Community", // Use actual entity type
          };
        });

      console.log("🎯 Valid targets being sent:", validTargets);

      if (validTargets.length === 0) {
        toast.error(
          "No valid entities selected. Please refresh and try again."
        );
        setIsSubmitting(false);
        return;
      }

      formDataToSend.append("targets", JSON.stringify(validTargets));

      if (formData.img) {
        formDataToSend.append("img", formData.img);
      }

      let response;

      if (selectedMeeting) {
        response = await api.put(
          `/meetings/${selectedMeeting._id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          // Refetch all meetings to ensure consistency
          const updatedResponse = await api.get("/meetings");
          if (updatedResponse.data.success) {
            const validMeetings = updatedResponse.data.data
              .filter((meeting: any) => meeting && meeting._id)
              .map((meeting: any) => {
                const communityData = meeting.community;
                const safeCommunity: Community = communityData
                  ? {
                      _id: communityData._id || "",
                      name:
                        communityData.name ||
                        communityData.communityName ||
                        "Unknown",
                      communityName: communityData.communityName,
                      states: communityData.states || [],
                      cities: communityData.cities || [],
                      type:
                        (communityData.type as "Community" | "CoreGroup") ||
                        "Community",
                    }
                  : {
                      _id: "",
                      name: "Unknown",
                      communityName: undefined,
                      states: [],
                      cities: [],
                      type: "Community" as const,
                    };
                return {
                  ...meeting,
                  community: safeCommunity,
                  allVisitors:
                    meeting.allVisitors || meeting.communityVisitors || [],
                  invitedVisitors: meeting.invitedVisitors || [],
                  registeredUsers: meeting.registeredUsers || [],
                } as Meeting;
              });
            setMeetings(validMeetings);
          }
          toast.success("Meeting updated successfully.");
        } else {
          toast.error(response.data.message || "Failed to update meeting.");
        }
      } else {
        response = await api.post("/meetings", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success || response.data.statusCode === 201) {
          const newMeeting = response.data.data;
          // Find the community object from entities, or create a safe default
          const communityObject =
            entities.find(
              (c) => c._id === newMeeting.community?._id || newMeeting.community
            ) ||
            (newMeeting.community
              ? {
                  _id:
                    typeof newMeeting.community === "string"
                      ? newMeeting.community
                      : newMeeting.community._id || "",
                  name: "Unknown", // Would ideally fetch full community here if only ID is returned
                  communityName: undefined,
                  states: [],
                  cities: [],
                  type: "Community" as const,
                }
              : {
                  _id: "",
                  name: "Unknown",
                  communityName: undefined,
                  states: [],
                  cities: [],
                  type: "Community" as const,
                });

          const formattedMeeting: Meeting = {
            ...newMeeting,
            community: communityObject,
            allVisitors:
              newMeeting.allVisitors || newMeeting.communityVisitors || [],
            invitedVisitors: newMeeting.invitedVisitors || [],
            registeredUsers: newMeeting.registeredUsers || [],
          };

          setMeetings([formattedMeeting, ...meetings]);
          toast.success("Meeting added successfully.");
        } else {
          toast.error(response.data.message || "Failed to add meeting.");
        }
      }

      setIsModalOpen(false);
      // Reset form after success
      setFormData({
        title: "",
        visitor: "",
        speaker: "",
        agenda: "",
        date: "",
        place: "",
        time: "",
        img: null,
        visitorFee: 0,
        country: [],
        state: [],
        city: [],
        targetId: [],
        targetType: "",
      });
      setImagePreview(null);
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message?.includes("413")) {
        toast.error("Image is too large. Please use a smaller image.");
      } else {
        toast.error("Failed to save the meeting.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle meeting deletion
  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

  // Confirm meeting deletion
  const handleConfirmDelete = async (id: string) => {
    try {
      const response = await api.delete(`/meetings/${id}`);
      if (response.data.success) {
        setMeetings((prev) => prev.filter((meeting) => meeting._id !== id));
        setConfirmDelete(null);
        toast.success("Meeting deleted successfully.");
      } else {
        toast.error(response.data.message || "Failed to delete meeting.");
      }
    } catch (error: any) {
      console.error("Delete error:", error.response || error);
      toast.error(error.response?.data?.message || "Failed to delete meeting.");
    }
  };

  // Cancel meeting deletion
  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // Filter meetings based on community selection
  const filteredMeetings = filterCommunity
    ? meetings.filter(
        (meeting) => meeting && meeting.community?._id === filterCommunity
      )
    : meetings.filter((meeting) => meeting); // Filter out any null/undefined meetings

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) return time;

    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Safe navigation to details, only if meeting exists
  const handleView = (meeting: Meeting) => {
    if (meeting && meeting._id) {
      navigate(`/meetings/${meeting._id}`);
    }
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="p-6 rounded-lg w-full mx-auto min-h-screen">
      <style>
        {`
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .loader {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <label className="text-gray-700">Filter by Community:</label>
              <select
                value={filterCommunity || ""}
                onChange={(e) => setFilterCommunity(e.target.value || null)}
                className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Communities</option>
                {entities.map((entity) => (
                  <option key={entity._id} value={entity._id}>
                    {entity.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <FiPlus size={20} /> Add Meeting
            </button>
          </div>

          {filteredMeetings.length === 0 ? (
            <p className="text-center text-gray-500">No meetings available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMeetings.map((meeting) =>
                meeting ? (
                  <div
                    key={meeting._id}
                    className="bg-white p-6 rounded-lg shadow-sm transition duration-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4">
                      <img
                        src={
                          meeting.img
                            ? `${import.meta.env.VITE_API_BASE_URL}/image/${
                                meeting.img
                              }`
                            : ""
                        }
                        alt={meeting.title}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/300x150.png?text=No+Image";
                        }}
                      />
                      <div>
                        <h2 className="text-2xl font-semibold mb-2">
                          {meeting.title}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <p>
                            <strong>Visitor Count:</strong> {meeting.visitor || 0}
                          </p>
                          <p>
                            <strong>Speaker Count:</strong> {meeting.speaker || 0}
                          </p>
                          <p>
                            <strong>Community:</strong>{" "}
                            {meeting.community
                              ? (() => {
                                  console.log(
                                    "🔍 Community data for meeting:",
                                    meeting.title,
                                    ":",
                                    meeting.community
                                  );
                                  return `${getCommunityName(
                                    meeting.community
                                  )} (${getCommunityType(meeting.community)})`;
                                })()
                              : "Unknown"}
                          </p>
                          <p>
                            <strong>Date:</strong>{" "}
                            {meeting.date
                              ? new Date(meeting.date).toLocaleDateString()
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Place:</strong> {meeting.place || "N/A"}
                          </p>
                          <p>
                            <strong>Time:</strong>{" "}
                            {meeting.time ? formatTime(meeting.time) : "N/A"}
                          </p>
                          <p>
                            <strong>Visitor Fee:</strong> ₹{meeting.visitorFee || 0}
                          </p>
                        </div>
                        <p className="mt-2 text-gray-700 line-clamp-2">
                          <strong>Agenda:</strong>{" "}
                          {truncateText(meeting.agenda || "")}
                        </p>
                        <div className="mt-4 flex gap-2 justify-between">
                          <button
                            onClick={() => handleView(meeting)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition duration-200"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openModal(meeting)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting._id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                      {confirmDelete === meeting._id && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-4">
                              Confirm Deletion
                            </h3>
                            <p>
                              Are you sure you want to delete "{meeting.title}"?
                            </p>
                            <div className="mt-4 flex justify-end gap-2">
                              <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleConfirmDelete(meeting._id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div
            ref={modalRef}
            className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
            <h3 className="text-xl font-semibold mb-6">
              {selectedMeeting ? "Update Meeting" : "Add New Meeting"}
            </h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Visitor Count</label>
                <input
                  type="number"
                  name="visitor"
                  value={formData.visitor}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Speaker Count</label>
                <input
                  type="number"
                  name="speaker"
                  value={formData.speaker}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700 mb-2">Country *</label>
                <Select
                  isMulti
                  isSearchable
                  options={countryOptions}
                  value={formData.country}
                  onChange={handleCountryChange}
                  placeholder="Search and select countries..."
                  noOptionsMessage={() => "No countries found"}
                  className="w-full"
                  styles={customSelectStyles}
                  filterOption={(option, searchText) => {
                    if (!searchText) return true;
                    const search = searchText.toLowerCase();
                    return option.label.toLowerCase().includes(search);
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700 mb-2">
                  {
                    getLocationFieldLabels(formData.country.map((c) => c.value))
                      .stateLabel
                  }
                </label>
                <Select
                  isMulti
                  isSearchable
                  options={stateOptions}
                  value={stateOptions
                    .flatMap((group) => group.options)
                    .filter((option) =>
                      formData.state.some((s) => s.value === option.value)
                    )}
                  onChange={handleStateChange}
                  placeholder={
                    getLocationPlaceholders(
                      formData.country.map((c) => c.value)
                    ).statePlaceholder
                  }
                  noOptionsMessage={() =>
                    "No states found for selected countries"
                  }
                  className="w-full"
                  styles={customSelectStyles}
                  isDisabled={
                    formData.country.length === 0 ||
                    !getLocationFieldVisibility(
                      formData.country.map((c) => c.value)
                    ).showStateField
                  }
                  filterOption={(option, searchText) => {
                    if (!searchText) return true;
                    const search = searchText.toLowerCase();
                    const optionData = option.data as Option;
                    return (
                      option.label.toLowerCase().includes(search) ||
                      optionData.country?.toLowerCase().includes(search) ||
                      false
                    );
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700 mb-2">
                  {
                    getLocationFieldLabels(
                      formData.country.map((c) => c.value),
                      formData.state.map((s) => s.value)
                    ).cityLabel
                  }
                </label>
                <Select
                  isMulti
                  isSearchable
                  options={cityOptions}
                  value={cityOptions
                    .flatMap((group) => group.options)
                    .filter((option) =>
                      formData.city.some((c) => c.value === option.value)
                    )}
                  onChange={handleCityChange}
                  placeholder={
                    getLocationPlaceholders(
                      formData.country.map((c) => c.value)
                    ).cityPlaceholder
                  }
                  noOptionsMessage={() => "No cities found for selected states"}
                  className="w-full"
                  styles={customSelectStyles}
                  isDisabled={
                    formData.state.length === 0 ||
                    !getLocationFieldVisibility(
                      formData.country.map((c) => c.value)
                    ).showCityField
                  }
                  filterOption={(option, searchText) => {
                    if (!searchText) return true;
                    const search = searchText.toLowerCase();
                    const optionData = option.data as Option;
                    return (
                      option.label.toLowerCase().includes(search) ||
                      optionData.state?.toLowerCase().includes(search) ||
                      false ||
                      optionData.country?.toLowerCase().includes(search) ||
                      false
                    );
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Entity *</label>
                <Select
                  isMulti
                  value={formData.targetId}
                  onChange={handleEntityChange}
                  options={getGroupedEntityOptions()}
                  styles={customSelectStyles}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  placeholder="Select Entities..."
                  isDisabled={
                    formData.country.length === 0 ||
                    (getLocationFieldVisibility(
                      formData.country.map((c) => c.value)
                    ).showCityField &&
                      formData.city.length === 0)
                  }
                  isClearable
                  isSearchable
                  noOptionsMessage={() => {
                    if (formData.country.length === 0) {
                      return "Please select a country first";
                    }
                    if (
                      getLocationFieldVisibility(
                        formData.country.map((c) => c.value)
                      ).showCityField &&
                      formData.city.length === 0
                    ) {
                      return "Please select cities first";
                    }
                    return "No entities found for selected location";
                  }}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Visitor Fee (₹)</label>
                <input
                  type="number"
                  name="visitorFee"
                  value={formData.visitorFee}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700">Agenda *</label>
                <textarea
                  name="agenda"
                  value={formData.agenda}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  rows={4}
                  placeholder="Enter meeting agenda"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Place *</label>
                <input
                  type="text"
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-gray-700">
                  Image{" "}
                  {selectedMeeting ? "(Leave empty to keep current image)" : ""}{" "}
                  *
                  <span className="text-sm text-gray-500 ml-2">
                    Max size: 2MB
                  </span>
                </label>
                <input
                  type="file"
                  name="img"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="w-full border p-2 rounded-md"
                  required={!selectedMeeting}
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-md"
                  />
                )}
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md transition duration-200 ${
                    isSubmitting
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && !isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to delete this meeting?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};

export default MeetingPage;