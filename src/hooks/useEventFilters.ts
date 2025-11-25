import { useState, useEffect } from "react";
import { Country, State, City } from "country-state-city";
import { fetchEvents, fetchCommunities } from "../api/eventApi";
import api from "../api/api";
import {
  Event,
  Option,
  GroupedOption,
} from "../EventInterface/EventInterface";

interface FilterState {
  selectedCountries: string[];
  selectedStates: string[];
  selectedCities: string[];
  selectedCommunities: string[];
  selectedEventTypes: string[];
  selectedPriceFilter: "all" | "paid" | "free";
  selectedStatusFilter: "all" | "future" | "past";
  dateRange: { start: string; end: string };
}

interface UseEventFiltersProps {
  onEventsUpdate?: (events: Event[]) => void;
  initialFilters?: Partial<FilterState>;
  initialEvents?: Event[];
}

export const useEventFilters = ({
  onEventsUpdate,
  initialFilters = {},
  initialEvents = [],
}: UseEventFiltersProps = {}) => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialFilters.selectedCountries || []
  );
  const [selectedStates, setSelectedStates] = useState<string[]>(
    initialFilters.selectedStates || []
  );
  const [selectedCities, setSelectedCities] = useState<string[]>(
    initialFilters.selectedCities || []
  );
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(
    initialFilters.selectedCommunities || []
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(
    initialFilters.selectedEventTypes || []
  );
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<"all" | "paid" | "free">(
    initialFilters.selectedPriceFilter || "all"
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "future" | "past">(
    initialFilters.selectedStatusFilter || "future"
  );
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(
    initialFilters.dateRange || { start: "", end: "" }
  );

  const [isFetching, setIsFetching] = useState(!initialEvents.length);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>(initialEvents);
  const [communities, setCommunities] = useState<any[]>([]);
  const [stateFilterOptions, setStateFilterOptions] = useState<GroupedOption[]>([]);
  const [cityFilterOptions, setCityFilterOptions] = useState<GroupedOption[]>([]);
  const [isInitialMount, setIsInitialMount] = useState(true);
const parseCountryData = (countryField: string | string[] | undefined): string[] => {
  if (!countryField) return [];
  
  if (Array.isArray(countryField)) return countryField;

  try {
    const parsed = JSON.parse(countryField);
    return Array.isArray(parsed) ? parsed : [countryField];
  } catch {
    return [countryField];
  }
};


  const countryOptions: Option[] = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  const eventTypeOptions: Option[] = [
    { value: "onedayevent", label: "One Day Event" },
    { value: "onlineevent", label: "Online Event" },
    { value: "tripevent", label: "Trip Event" },
  ];

  useEffect(() => {
    const initialFetch = async () => {
      setIsFetching(true);
      try {
        const events = initialEvents.length ? initialEvents : await fetchEvents({});
        // Don't fetch communities initially - they'll be fetched when country filter is applied
        setAllEvents(events);
        setFilteredEvents(events);
        setCommunities([]);
        onEventsUpdate?.(events);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setIsFetching(false);
        setIsInitialMount(false);
      }
    };
    initialFetch();
  }, []);

  useEffect(() => {
    if (!selectedCountries.length) {
      setStateFilterOptions([]);
      setSelectedStates([]);
      setCityFilterOptions([]);
      setSelectedCities([]);
      return;
    }

    const groupedStates: GroupedOption[] = selectedCountries.map((code) => {
      const country = Country.getAllCountries().find((c) => c.isoCode === code);
      const states = State.getStatesOfCountry(code).map((state) => ({
        value: state.isoCode,
        label: state.name,
        country: country?.name || "",
      }));
      return { label: country?.name || code, options: states };
    });

    setStateFilterOptions(groupedStates);
  }, [selectedCountries]);

  useEffect(() => {
    if (!selectedStates.length || !selectedCountries.length) {
      setCityFilterOptions([]);
      setSelectedCities([]);
      return;
    }

    const groupedCities: GroupedOption[] = selectedStates.map((stateCode) => {
      // Find the state and ensure we get the correct country
      const stateData = State.getAllStates().find((s) => s.isoCode === stateCode);

      // Get the country code from selected countries to ensure correct matching
      const countryCode = selectedCountries.find((code) => {
        const states = State.getStatesOfCountry(code);
        return states.some((s) => s.isoCode === stateCode);
      }) || stateData?.countryCode;

      const cities = City.getCitiesOfState(countryCode!, stateCode).map((city) => ({
        value: city.name,
        label: city.name,
        state: stateData?.name || stateCode,
      }));
      return { label: stateData?.name || stateCode, options: cities };
    });

    setCityFilterOptions(groupedCities);
  }, [selectedStates, selectedCountries]);

  useEffect(() => {
    const fetchLocationBasedCommunities = async () => {
      // If no country is selected, don't fetch communities (API requires at least country)
      if (!selectedCountries.length) {
        setCommunities([]);
        setSelectedCommunities([]);
        setIsLoadingCommunities(false);
        return;
      }

      setIsLoadingCommunities(true);
      try {
        // Use DIRECT API call like event management does
        // API expects: { country: "IN", state: "GJ" } (ISO codes!)
        const params: Record<string, string> = {
          country: selectedCountries[0], // Single country ISO code
        };

        // Add state ISO code if selected (NOT name!)
        if (selectedStates.length > 0) {
          params.state = selectedStates[0]; // Single state ISO code
        }

        console.log("🔄 Fetching communities with direct API call:", params);

        // Direct API call to /meetings/entities (same as event management)
        const response = await api.get("/meetings/entities", { params });

        const allCommunities = response.data.success && response.data.data ?
          response.data.data.map((entity: any) => ({
            _id: entity._id,
            name: entity.name || entity.communityName || "Unknown",
            status: entity.status || "active",
            type: entity.type || "Community",
            city: entity.city || entity.region,
          })) : [];

        console.log("✅ Communities fetched from API:", allCommunities.length);

        // Backend doesn't return city data for communities, so we can't filter by city
        // Just show all communities from the selected country/state
        setCommunities(allCommunities);
        // Clear selected communities when location changes
        setSelectedCommunities([]);
      } catch (error) {
        console.error("Error fetching location-based communities:", error);
        setCommunities([]);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchLocationBasedCommunities();
  }, [selectedCountries, selectedStates, selectedCities]);

  useEffect(() => {
    if (isInitialMount) return;

    let filtered = [...allEvents];

    if (selectedCountries.length > 0) {
  filtered = filtered.filter((event) => {
    const eventCountries = parseCountryData(event.country);

    return selectedCountries.some((selectedCode) => {
      const country = Country.getAllCountries().find((c) => c.isoCode === selectedCode);
      return eventCountries.includes(country?.name || selectedCode);
    });
  });
}



    // 🏙️ State filter
    if (selectedStates.length > 0) {
      filtered = filtered.filter((event) => {
        const eventStates = Array.isArray(event.state) ? event.state : event.state ? [event.state] : [];
        return selectedStates.some((stateCode) => {
          const state = State.getAllStates().find((s) => s.isoCode === stateCode);
          const stateName = state?.name || stateCode;
          return eventStates.some((s) => s === stateName || s === stateCode);
        });
      });
    }

    // 🌆 City filter
    if (selectedCities.length > 0) {
      filtered = filtered.filter((event) =>
        selectedCities.some((city) => event.location?.toLowerCase().includes(city.toLowerCase()))
      );
    }

    // 👥 Community filter ✅ FIXED
    if (selectedCommunities.length > 0) {
      filtered = filtered.filter((event) =>
        selectedCommunities.some((communityId) =>
          event.communities?.some((c) => c._id === communityId)
        )
      );
    }

    // 🎭 Event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter((event) => selectedEventTypes.includes(event.eventType));
    }

    // 💰 Price filter
    if (selectedPriceFilter !== "all") {
      filtered = filtered.filter((event) => {
        if (selectedPriceFilter === "paid") {
          return event.accessMode === "paid" || event.accessMode === "free-paid";
        } else if (selectedPriceFilter === "free") {
          return event.accessMode === "free";
        }
        return true;
      });
    }

    // ⏰ Event status filter (future/past)
    if (selectedStatusFilter !== "all") {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      filtered = filtered.filter((event) => {
        let eventDate = event.eventType === "tripevent" ? new Date(event.startDate || "") : new Date(event.date || "");
        if (isNaN(eventDate.getTime())) return false;

        if (selectedStatusFilter === "future") {
          return eventDate >= now;
        } else if (selectedStatusFilter === "past") {
          return eventDate < now;
        }
        return true;
      });
    }

    // 📅 Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((event) => {
        let eventDate = event.eventType === "tripevent" ? new Date(event.startDate || "") : new Date(event.date || "");
        if (isNaN(eventDate.getTime())) return false;
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        if (startDate && endDate) return eventDate >= startDate && eventDate <= endDate;
        if (startDate) return eventDate >= startDate;
        if (endDate) return eventDate <= endDate;
        return true;
      });
    }

    setFilteredEvents(filtered);
    onEventsUpdate?.(filtered);
  }, [
    selectedCountries,
    selectedStates,
    selectedCities,
    selectedCommunities,
    selectedEventTypes,
    selectedPriceFilter,
    selectedStatusFilter,
    dateRange,
    allEvents,
    isInitialMount,
    onEventsUpdate,
  ]);

  const clearFilters = () => {
    setSelectedCountries([]);
    setSelectedStates([]);
    setSelectedCities([]);
    setSelectedCommunities([]);
    setSelectedEventTypes([]);
    setSelectedPriceFilter("all");
    setSelectedStatusFilter("all");
    setDateRange({ start: "", end: "" });
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    if (newFilters.selectedCountries !== undefined) setSelectedCountries(newFilters.selectedCountries);
    if (newFilters.selectedStates !== undefined) setSelectedStates(newFilters.selectedStates);
    if (newFilters.selectedCities !== undefined) setSelectedCities(newFilters.selectedCities);
    if (newFilters.selectedCommunities !== undefined) setSelectedCommunities(newFilters.selectedCommunities);
    if (newFilters.selectedEventTypes !== undefined) setSelectedEventTypes(newFilters.selectedEventTypes);
    if (newFilters.selectedPriceFilter !== undefined) setSelectedPriceFilter(newFilters.selectedPriceFilter);
    if (newFilters.selectedStatusFilter !== undefined) setSelectedStatusFilter(newFilters.selectedStatusFilter);
    if (newFilters.dateRange !== undefined) setDateRange(newFilters.dateRange);
  };

  const refreshEvents = async () => {
    setIsFetching(true);
    try {
      const [events, allCommunities] = await Promise.all([fetchEvents({}), fetchCommunities({})]);
      setAllEvents(events);
      setFilteredEvents(events);
      setCommunities(allCommunities);
      onEventsUpdate?.(events);
    } catch (error) {
      console.error("Error refreshing events:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const getFilterCounts = () => ({
    countries: selectedCountries.length,
    states: selectedStates.length,
    cities: selectedCities.length,
    communities: selectedCommunities.length,
    eventTypes: selectedEventTypes.length,
    hasDateRange: !!(dateRange.start || dateRange.end),
    hasPriceFilter: selectedPriceFilter !== "all",
    hasStatusFilter: selectedStatusFilter !== "all",
  });

  const hasActiveFilters = () => {
    const counts = getFilterCounts();
    return counts.countries > 0 || counts.states > 0 || counts.cities > 0 || counts.communities > 0 || counts.eventTypes > 0 || counts.hasDateRange || counts.hasPriceFilter || counts.hasStatusFilter;
  };

  const setInitialEvents = (events: Event[]) => {
    setAllEvents(events);
    setFilteredEvents(events);
    onEventsUpdate?.(events);
  };

  return {
    selectedCountries,
    setSelectedCountries,
    selectedStates,
    setSelectedStates,
    selectedCities,
    setSelectedCities,
    selectedCommunities,
    setSelectedCommunities,
    selectedEventTypes,
    setSelectedEventTypes,
    selectedPriceFilter,
    setSelectedPriceFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    dateRange,
    setDateRange,
    events: filteredEvents,
    communities,
    isFetching,
    isLoadingCommunities,
    countryOptions,
    stateFilterOptions,
    cityFilterOptions,
    eventTypeOptions,
    clearFilters,
    updateFilters,
    refreshEvents,
    getFilterCounts,
    hasActiveFilters,
    setInitialEvents,
    filters: { selectedCountries, selectedStates, selectedCities, selectedCommunities, selectedEventTypes, selectedPriceFilter, selectedStatusFilter, dateRange },
  };
};
