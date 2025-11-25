import api from "./api";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import {
  Event,
  Community,
  ApiResponse,
} from "../EventInterface/EventInterface";
import { formatDateForInput } from "../utils/eventHelpers";

export interface FetchEventsParams {
  selectedCountries?: string[];
  selectedStates?: string[];
  selectedCommunities?: string[];
  selectedEventTypes?: string[];
  dateRange?: { start: string; end: string };
  paidFilter?: "all" | "paid" | "free";
}

export interface FetchCommunitiesParams {
  countries?: string[];
  states?: string[];
  cities?: string[];
}

export const fetchEvents = async (
  params: FetchEventsParams = {}
): Promise<Event[]> => {
  try {
    const queryParams: Record<string, any> = {
      state: params.selectedStates?.length ? params.selectedStates : undefined,
      community: params.selectedCommunities?.length
        ? params.selectedCommunities
        : undefined,
      eventType: params.selectedEventTypes?.length
        ? params.selectedEventTypes
        : undefined,
    };
    if (params.selectedCountries?.length) {
      queryParams.country = params.selectedCountries;
    }
    if (params.dateRange?.start && params.dateRange?.end) {
      queryParams.startDate = params.dateRange.start;
      queryParams.endDate = params.dateRange.end;
    }
    if (params.paidFilter && params.paidFilter !== "all") {
      queryParams.isPaid = params.paidFilter === "paid";
    }
    const response = await api.get<ApiResponse<Event[]>>("/events/event", {
      params: queryParams,
    });
    if (response.data.success && Array.isArray(response.data.data)) {
      const formattedEvents = response.data.data.map((event) => {
        const formattedEvent: any = { ...event };
        if (event.date) formattedEvent.date = formatDateForInput(event.date);
        if (event.startDate)
          formattedEvent.startDate = formatDateForInput(event.startDate);
        if (event.endDate)
          formattedEvent.endDate = formatDateForInput(event.endDate);
        return formattedEvent;
      });
      return formattedEvents;
    } else {
      toast.error(response.data.message || "Failed to fetch events");
      return [];
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    toast.error(
      (error as AxiosError<{ message?: string }>).response?.data?.message ||
        "Failed to load events"
    );
    return [];
  }
};

export const fetchCommunities = async (
  params: FetchCommunitiesParams = {}
): Promise<Community[]> => {
  const { countries = [], states = [], cities = [] } = params;

  if (countries.length === 0) {
    console.log("🚫 fetchCommunities called without country");
    return [];
  }

  try {
    const uniqueEntities = new Map<string, Community>();

    const queryParams: Record<string, string> = {
      country: countries.join(","),
    };
    if (states.length) queryParams.state = states.join(",");
    if (cities.length) queryParams.city = cities.join(",");

    console.log("🔄 fetchCommunities: Fetching with params:", queryParams);

    // Only fetch from /meetings/entities
    const response = await api.get<ApiResponse<Community[]>>(
      "/meetings/entities",
      { params: queryParams }
    );

    if (response.data.success && response.data.data && response.data.data.length > 0) {
      response.data.data.forEach((item: Community) => {
        if (item && item._id && !uniqueEntities.has(item._id)) {
          uniqueEntities.set(item._id, {
            _id: item._id,
            name: item.name || "Unknown",
            status: item.status || "active",
            type: item.type || "Community",
          });
        }
      });
      console.log("✅ Successfully fetched communities");
    } else {
      console.warn("⚠️ No communities returned from /meetings/entities");
    }

    const finalEntities = Array.from(uniqueEntities.values());
    console.log("✅ fetchCommunities: Final combined entities:", finalEntities.length);
    return finalEntities;

  } catch (error) {
    console.error("❌ Unexpected error in fetchCommunities:", error);
    return [];
  }
};


export const fetchCommunitiesForLocations = async (
  countries: string[],
  states: string[],
  cities: string[]
): Promise<Community[]> => {
  return fetchCommunities({ countries, states, cities });
};
