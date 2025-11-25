import React, { useState } from "react";
import Select, { MultiValue } from "react-select";
import { Option } from "../../EventInterface/EventInterface";
import { Filter, X, Calendar, MapPin, Zap, Users, DollarSign, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface EventFiltersProps {
  selectedCountries: string[];
  setSelectedCountries: (v: string[]) => void;
  selectedStates: string[];
  setSelectedStates: (v: string[]) => void;
  selectedCities: string[];
  setSelectedCities: (v: string[]) => void;
  selectedCommunities: string[];
  setSelectedCommunities: (v: string[]) => void;
  selectedEventTypes: string[];
  setSelectedEventTypes: (v: string[]) => void;
  selectedPriceFilter: "all" | "paid" | "free";
  setSelectedPriceFilter: (v: "all" | "paid" | "free") => void;
  selectedStatusFilter: "all" | "future" | "past";
  setSelectedStatusFilter: (v: "all" | "future" | "past") => void;
  dateRange: { start: string; end: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
  communities: any[];
  countryOptions: Option[];
  stateFilterOptions: any[];
  cityFilterOptions: any[];
  eventTypeOptions: Option[];
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
  isFetching?: boolean;
  isLoadingCommunities?: boolean;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
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
  communities,
  countryOptions,
  stateFilterOptions,
  cityFilterOptions,
  eventTypeOptions,
  clearFilters,
  hasActiveFilters,
  isFetching = false,
  isLoadingCommunities = false,
}) => {
  const communityOptions = communities.map((c) => ({
    value: c._id,
    label: c.name,
  }));

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* --- Filters header --- */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-blue-600" />
            Event Filters
          </h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center text-sm font-medium transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        {isFetching && (
          <div className="mt-4 flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading events...
          </div>
        )}
      </div>

      {/* --- Filters selection --- */}
      {isExpanded && (
        <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {/* Countries */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline w-4 h-4 mr-1" />
              Countries
            </label>
            <Select
              isMulti
              options={countryOptions}
              value={countryOptions.filter((o) =>
                selectedCountries.includes(o.value)
              )}
              onChange={(v: MultiValue<Option>) =>
                setSelectedCountries(v.map((o) => o.value))
              }
              placeholder="Select countries..."
              className="text-sm"
              classNamePrefix="react-select"
            />
          </div>

          {/* States */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline w-4 h-4 mr-1" />
              States
            </label>
            <Select
              isMulti
              options={stateFilterOptions}
              value={stateFilterOptions
                .flatMap((group) => group.options)
                .filter((o) => selectedStates.includes(o.value))}
              onChange={(v: MultiValue<Option>) =>
                setSelectedStates(v.map((o) => o.value))
              }
              isDisabled={selectedCountries.length === 0}
              placeholder={
                selectedCountries.length === 0
                  ? "Select country first..."
                  : "Select states..."
              }
              className="text-sm"
              classNamePrefix="react-select"
            />
          </div>

          {/* Cities */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline w-4 h-4 mr-1" />
              Cities
            </label>
            <Select
              isMulti
              options={cityFilterOptions}
              value={cityFilterOptions
                .flatMap((group) => group.options)
                .filter((o) => selectedCities.includes(o.value))}
              onChange={(v: MultiValue<Option>) =>
                setSelectedCities(v.map((o) => o.value))
              }
              isDisabled={selectedStates.length === 0}
              placeholder={
                selectedStates.length === 0
                  ? "Select state first..."
                  : "Select cities..."
              }
              className="text-sm"
              classNamePrefix="react-select"
            />
          </div>

          {/* Communities */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Users className="inline w-4 h-4 mr-1" />
              Communities
            </label>
            <Select
              isMulti
              options={communityOptions}
              value={communityOptions.filter((o) =>
                selectedCommunities.includes(o.value)
              )}
              onChange={(v: MultiValue<Option>) =>
                setSelectedCommunities(v.map((o) => o.value))
              }
              placeholder="Select communities..."
              className="text-sm"
              classNamePrefix="react-select"
              isLoading={isLoadingCommunities}
              loadingMessage={() => "Loading communities..."}
            />
          </div>

          {/* Event Types */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Zap className="inline w-4 h-4 mr-1" />
              Event Types
            </label>
            <Select
              isMulti
              options={eventTypeOptions}
              value={eventTypeOptions.filter((o) =>
                selectedEventTypes.includes(o.value)
              )}
              onChange={(v: MultiValue<Option>) =>
                setSelectedEventTypes(v.map((o) => o.value))
              }
              placeholder="Select event types..."
              className="text-sm"
              classNamePrefix="react-select"
            />
          </div>

          {/* Price Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Price
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPriceFilter("all")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPriceFilter === "all"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedPriceFilter("paid")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPriceFilter === "paid"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setSelectedPriceFilter("free")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedPriceFilter === "free"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Free
              </button>
            </div>
          </div>

          {/* Event Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Clock className="inline w-4 h-4 mr-1" />
              Event Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatusFilter("future")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedStatusFilter === "future"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setSelectedStatusFilter("past")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedStatusFilter === "past"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Past
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2 md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Start date"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="End date"
              />
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};
