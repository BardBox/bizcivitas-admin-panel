import React, { useRef, useEffect } from "react";
import { X, Edit2, Trash2, AlertCircle, Filter } from "lucide-react";
import Modal from "react-modal";
import Select, { MultiValue, StylesConfig } from "react-select";
import { toast } from "react-toastify";
import { useVisibility } from "../../context/VisibilityContext";
import { formatDateForInput } from "../../utils/eventHelpers";
import RichTextEditor from "../../component/RichTextEditor";

import {
  EventForm,
  EventAccessType,
  Option,
  // Event type is used for filteredEvents array typing
} from "../../EventInterface/EventInterface";
import {
  SERVER_URL,
  EVENT_TYPE_OPTIONS,
  MEMBERSHIP_OPTIONS,
} from "../../constants/eventConstants";
import { useEventManagement } from "../../hooks/useEventManagement";
import { useEventFilters } from "../../hooks/useEventFilters";
import { EventFilters } from "../../components/events/EventFilters";
import { DeleteConfirmationModal } from "../../components/events/DeleteConfirmationModal";

Modal.setAppElement("#root");

// Custom styles for react-select
const customSelectStyles: StylesConfig<Option, true> = {
  control: (provided) => ({
    ...provided,
    borderRadius: "8px",
    borderColor: "#e2e8f0",
    padding: "4px",
    boxShadow: "none",
    minHeight: "44px",
    "&:hover": {
      borderColor: "#2563eb",
    },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    maxHeight: "300px",
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: "300px",
    overflowY: "auto",
  }),
  option: (provided, state) => ({
    ...provided,
    padding: "10px 12px",
    fontSize: "14px",
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
      ? "#f1f5f9"
      : "white",
    color: state.isSelected ? "white" : "#374151",
    "&:hover": {
      backgroundColor: state.isSelected ? "#2563eb" : "#f1f5f9",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e0f2fe",
    borderRadius: "4px",
    margin: "2px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#1e40af",
    fontSize: "13px",
    padding: "4px 6px",
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#1e40af",
    "&:hover": {
      backgroundColor: "#bfdbfe",
      color: "#1e3a8a",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "14px",
  }),
  groupHeading: (provided) => ({
    ...provided,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    fontWeight: "600",
    fontSize: "14px",
    padding: "10px 12px",
    margin: "0",
    borderBottom: "1px solid #e5e7eb",
    textTransform: "none",
  }),
  group: (provided) => ({
    ...provided,
    paddingTop: "0",
    paddingBottom: "0",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "6px 8px",
    minHeight: "32px",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "44px",
  }),
};

// Error message component
const ErrorMessage: React.FC<{ error?: string }> = ({ error }) => {
  if (!error) return null;
  return (
    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
      <AlertCircle size={14} />
      <span>{error}</span>
    </div>
  );
};

const AdminEvents: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();

  const {
    events: filteredEvents, // Event[] type from hook
    communities: filterCommunities,
    countryOptions: filterCountryOptions,
    stateFilterOptions,
    cityFilterOptions,
    eventTypeOptions,
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
    clearFilters,
    hasActiveFilters,
    isFetching,
    isLoadingCommunities,
    refreshEvents,
  } = useEventFilters();
  const {
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
    newEvent,
    setNewEvent,
    countryOptions,
    fileInputRef,
    getLocationFieldLabels,
    getLocationPlaceholders,
    getLocationFieldVisibility,
    handleLocationChange,
    handleChange,
    handleImageUpload,
    handleSubmit,
    resetForm,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleOpenParticipants,
    formErrors,
    setFormErrors,
  } = useEventManagement(refreshEvents);

  const [showFilters, setShowFilters] = React.useState(false);

  // Refs for form fields
  const eventNameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const onlineLinkRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // Custom validation function
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Event Name - Required
    if (!newEvent.eventName.trim()) {
      errors.eventName = "Please fill out this field";
    }

    // Date validation based on event type
    if (
      newEvent.eventType === "onedayevent" ||
      newEvent.eventType === "onlineevent"
    ) {
      if (!newEvent.date) {
        errors.date = "Please fill out this field";
      }
    } else if (newEvent.eventType === "tripevent") {
      if (!newEvent.startDate) {
        errors.startDate = "Please fill out this field";
      }
      if (!newEvent.endDate) {
        errors.endDate = "Please fill out this field";
      }
    }

    // Time validation
    if (newEvent.eventType !== "tripevent") {
      if (!newEvent.startTime) {
        errors.startTime = "Please fill out this field";
      }
      if (!newEvent.endTime) {
        errors.endTime = "Please fill out this field";
      }
    }

    // Location/Online Link validation
    if (newEvent.eventType !== "onlineevent") {
      if (!newEvent.location.trim()) {
        errors.location = "Please fill out this field";
      }
    } else {
      if (!newEvent.onlineLink.trim()) {
        errors.onlineLink = "Please fill out this field";
      }
    }

    // Amount validation for paid events
    if (
      newEvent.eventAccessType === "paid" ||
      newEvent.eventAccessType === "free-paid"
    ) {
      if (!newEvent.amount || parseFloat(newEvent.amount) <= 0) {
        errors.amount = "Please fill out this field";
      }
    }

    // Image validation for new events
    if (!editingEvent && !newEvent.img) {
      errors.img = "Please fill out this field";
    }

    // Description validation
    if (!newEvent.description.trim()) {
      errors.description = "Please fill out this field";
    }

    return errors;
  };

  // Custom form submission with validation and scrolling
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      // Set errors for display
      // Note: This assumes formErrors is a state setter, adjust if needed
      // For now, we'll use a local state approach
      setFormErrors(validationErrors);

      // Scroll to first error field
      const errorFields = [
        { key: "eventName", ref: eventNameRef },
        { key: "date", ref: dateRef, skipScrollIfPresentDay: true },
        { key: "startDate", ref: startDateRef },
        { key: "endDate", ref: endDateRef },
        { key: "startTime", ref: startTimeRef },
        { key: "endTime", ref: endTimeRef },
        { key: "location", ref: locationRef },
        { key: "onlineLink", ref: onlineLinkRef },
        { key: "amount", ref: amountRef },
        { key: "img", ref: fileInputRef },
        { key: "description", ref: descriptionRef },
      ];

      for (const { key, ref, skipScrollIfPresentDay } of errorFields) {
        if (validationErrors[key] && ref && ref.current) {
          // Special handling for date field - don't scroll if it's present day error (not empty field error)
          if (skipScrollIfPresentDay && key === "date") {
            const today = new Date().toISOString().split("T")[0];
            const isPresentDayError =
              newEvent.date === today &&
              validationErrors[key] === "Event date must be in the future.";
            if (isPresentDayError) {
              continue; // Skip scrolling for present day date error
            }
          }

          ref.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          if (ref.current.focus) ref.current.focus();
          break;
        }
      }
      return;
    }

    // If validation passes, call original handleSubmit
    await handleSubmit(e);
  };

  useEffect(() => {
    setSidebarAndHeaderVisibility(!showForm && !showDeleteConfirm);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [showForm, showDeleteConfirm, setSidebarAndHeaderVisibility]);

  // Cleanup toasts when component unmounts to prevent them from appearing on other pages
  useEffect(() => {
    return () => {
      toast.dismiss();
    };
  }, []);

  const countries = newEvent.country.map((c) => c.value);
  const states = newEvent.state.map((s) => s.value);
  const cities = newEvent.region.map((r) => r.value);
  // const isNewForm = showForm && !editingEvent;
  // const locationVisibility = getLocationFieldVisibility(countries, states, cities, isNewForm);
  const locationVisibility = getLocationFieldVisibility(
    countries,
    states,
    cities
  );

  const getImageSizeInMB = () => {
    if (newEvent.img && newEvent.img.size) {
      return (newEvent.img.size / (1024 * 1024)).toFixed(2);
    }
    return null;
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg font-medium text-gray-600">
          Loading events...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Event
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      {showFilters && (
        <EventFilters
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          selectedCommunities={selectedCommunities}
          setSelectedCommunities={setSelectedCommunities}
          selectedEventTypes={selectedEventTypes}
          setSelectedEventTypes={setSelectedEventTypes}
          selectedPriceFilter={selectedPriceFilter}
          setSelectedPriceFilter={setSelectedPriceFilter}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          communities={filterCommunities}
          countryOptions={filterCountryOptions}
          stateFilterOptions={stateFilterOptions}
          cityFilterOptions={cityFilterOptions}
          eventTypeOptions={eventTypeOptions}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          isFetching={isFetching}
          isLoadingCommunities={isLoadingCommunities}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const imageUrl = event.img
              ? `${SERVER_URL}/image/${event.img}`
              : null;
            const eventDate =
              event.eventType === "tripevent"
                ? `${formatDateForInput(
                    event.startDate || ""
                  )} - ${formatDateForInput(event.endDate || "")}`
                : formatDateForInput(event.date || "");
            return (
              <div
                key={event._id}
                className="p-6 bg-white shadow-md rounded-lg h-full overflow-y-auto"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={event.eventName}
                    className="w-full h-48 object-cover rounded-md mb-4"
                    onError={(e) => {
                      console.warn(
                        `Failed to load image for event ${event._id}: ${imageUrl}`
                      );
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                ) : (
                  <img
                    src="/placeholder.jpg"
                    alt="No image"
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <div className="flex items-center mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.accessMode === "free"
                        ? "bg-green-100 text-green-800"
                        : event.accessMode === "paid"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {event.accessMode === "free"
                      ? "FREE ACCESS"
                      : event.accessMode === "paid"
                      ? "PAID ACCESS"
                      : "FREE/PAID ACCESS"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {event.eventName}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Subtitle:</span>{" "}
                  {event.subtitle || "None"}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Date:</span> {eventDate}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Time:</span>{" "}
                  {event.startTime && event.endTime
                    ? `${event.startTime} - ${event.endTime}`
                    : "Not specified"}
                </p>
                {event.eventType !== "onlineevent" && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Location:</span>{" "}
                    {event.location}
                  </p>
                )}
                {event.eventType === "onlineevent" && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Online Link:</span>{" "}
                    {event.onlineLink || "Not provided"}
                  </p>
                )}
                <div className="flex justify-between gap-2 mb-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                  >
                    <Edit2 className="inline mr-2" size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleOpenParticipants(event)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => confirmDelete(event._id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
                    disabled={isLoading}
                  >
                    <Trash2 className="inline mr-2" size={16} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500 py-12 bg-white rounded-lg shadow">
            <p className="text-xl mb-2">No events found</p>
            <p className="text-sm">
              Try adjusting your filters or add a new event
            </p>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => eventToDelete && handleDelete(eventToDelete)}
        isLoading={isLoading}
        eventName={
          eventToDelete
            ? filteredEvents.find((e) => e._id === eventToDelete)?.eventName
            : undefined
        }
      />

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  // setFormErrors({});
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <div className="flex gap-4">
                    {EVENT_TYPE_OPTIONS.map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="radio"
                          name="eventType"
                          value={type.value}
                          checked={newEvent.eventType === type.value}
                          onChange={handleChange}
                          className="mr-2"
                        />
                        {type.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 ">
                    Event Access Configuration
                  </label>
                  <div className="flex gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="eventAccessType"
                        value="free"
                        checked={newEvent.eventAccessType === "free"}
                        onChange={(e) => {
                          setNewEvent((prev: EventForm) => ({
                            ...prev,
                            eventAccessType: e.target.value as EventAccessType,
                            paidMemberships: [],
                            isPaid: false,
                          }));
                        }}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="font-medium">FREE</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="eventAccessType"
                        value="paid"
                        checked={newEvent.eventAccessType === "paid"}
                        onChange={(e) => {
                          setNewEvent((prev: EventForm) => ({
                            ...prev,
                            eventAccessType: e.target.value as EventAccessType,
                            freeMemberships: [],
                            isPaid: true,
                          }));
                        }}
                        className="mr-2 h-4 w-4 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="font-medium ">PAID</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="eventAccessType"
                        value="free-paid"
                        checked={newEvent.eventAccessType === "free-paid"}
                        onChange={(e) => {
                          setNewEvent((prev: EventForm) => ({
                            ...prev,
                            eventAccessType: e.target.value as EventAccessType,
                            isPaid: true,
                          }));
                        }}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="font-medium ">FREE/PAID</span>
                    </label>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <div className="rounded-lg">
                    <span className="text-sm font-medium mr-2">
                      Event Access:
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        newEvent.eventAccessType === "free"
                          ? "bg-green-100 text-green-800"
                          : newEvent.eventAccessType === "paid"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {newEvent.eventAccessType === "free"
                        ? "FREE"
                        : newEvent.eventAccessType === "paid"
                        ? "PAID"
                        : "FREE/PAID"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name
                  </label>
                  <input
                    ref={eventNameRef}
                    type="text"
                    name="eventName"
                    value={newEvent.eventName}
                    onChange={handleChange}
                    placeholder="Event Name"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                      formErrors.eventName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                  <ErrorMessage error={formErrors.eventName} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle <span className="text-gray-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="subtitle"
                    value={newEvent.subtitle}
                    onChange={handleChange}
                    placeholder="Subtitle"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {newEvent.eventType === "onedayevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date
                    </label>
                    <input
                      ref={dateRef}
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                        formErrors.date
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      disabled={!!editingEvent && isDateDisabled}
                      required
                    />
                    <ErrorMessage error={formErrors.date} />
                  </div>
                )}

                {newEvent.eventType === "onlineevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Date
                    </label>
                    <input
                      ref={dateRef}
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={handleChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                        formErrors.date
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      disabled={!!editingEvent && isDateDisabled}
                      required
                    />
                    <ErrorMessage error={formErrors.date} />
                  </div>
                )}

                {newEvent.eventType === "tripevent" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        ref={startDateRef}
                        type="date"
                        name="startDate"
                        value={newEvent.startDate}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                          formErrors.startDate
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        disabled={!!editingEvent && isDateDisabled}
                        required
                      />
                      <ErrorMessage error={formErrors.startDate} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        ref={endDateRef}
                        type="date"
                        name="endDate"
                        value={newEvent.endDate}
                        onChange={handleChange}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                          formErrors.endDate
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        disabled={!!editingEvent && isDateDisabled}
                        required
                      />
                      <ErrorMessage error={formErrors.endDate} />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time{" "}
                    {newEvent.eventType === "tripevent" && (
                      <span className="text-gray-500">(Optional)</span>
                    )}
                  </label>
                  <input
                    ref={startTimeRef}
                    type="time"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                      formErrors.startTime
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required={newEvent.eventType !== "tripevent"}
                  />
                  <ErrorMessage error={formErrors.startTime} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time{" "}
                    {newEvent.eventType === "tripevent" && (
                      <span className="text-gray-500">(Optional)</span>
                    )}
                  </label>
                  <input
                    ref={endTimeRef}
                    type="time"
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                      formErrors.endTime
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    required={newEvent.eventType !== "tripevent"}
                  />
                  <ErrorMessage error={formErrors.endTime} />
                </div>

                {newEvent.eventType !== "onlineevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      ref={locationRef}
                      type="text"
                      name="location"
                      value={newEvent.location}
                      onChange={handleChange}
                      placeholder="Location"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                        formErrors.location
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                    />
                    <ErrorMessage error={formErrors.location} />
                  </div>
                )}

                {newEvent.eventType === "onlineevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Online Link
                    </label>
                    <input
                      ref={onlineLinkRef}
                      type="text"
                      name="onlineLink"
                      value={newEvent.onlineLink}
                      onChange={handleChange}
                      placeholder="https://example.com/meeting"
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                        formErrors.onlineLink
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      required
                    />
                    <ErrorMessage error={formErrors.onlineLink} />
                  </div>
                )}

                {locationVisibility.showCountry && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <Select
                      isMulti
                      isSearchable
                      options={[
                        {
                          value: "ALL_COUNTRIES",
                          label: "🌍 All Countries (Worldwide Access)",
                        },
                        ...countryOptions,
                      ]}
                      value={newEvent.country}
                      onChange={(selected: MultiValue<Option>) =>
                        handleLocationChange("country", selected)
                      }
                      placeholder="Search and select countries..."
                      noOptionsMessage={() => "No countries found"}
                      className={`w-full ${
                        formErrors.country ? "border-red-500" : ""
                      }`}
                      styles={customSelectStyles}
                    />
                    <ErrorMessage error={formErrors.country} />
                  </div>
                )}

                {locationVisibility.showState && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getLocationFieldLabels(countries).stateLabel}
                    </label>
                    <Select
                      isMulti
                      isSearchable
                      options={[
                        {
                          value: "ALL_STATES",
                          label: "🏛️ All States (Country-wide Access)",
                        },
                        ...stateOptions,
                      ]}
                      value={newEvent.state}
                      onChange={(selected: MultiValue<Option>) =>
                        handleLocationChange("state", selected)
                      }
                      placeholder={
                        getLocationPlaceholders(countries).statePlaceholder
                      }
                      noOptionsMessage={() =>
                        "No states found for selected countries"
                      }
                      className="w-full"
                      styles={customSelectStyles}
                      isDisabled={countries.length === 0}
                    />
                    <ErrorMessage error={formErrors.state} />
                  </div>
                )}

                {locationVisibility.showCity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {getLocationFieldLabels(countries, states).cityLabel}
                    </label>
                    <Select
                      isMulti
                      isSearchable
                      options={[
                        {
                          value: "ALL_CITIES",
                          label: "🏙️ All Cities (State-wide Access)",
                        },
                        ...cityOptions,
                      ]}
                      value={newEvent.region}
                      onChange={(selected: MultiValue<Option>) =>
                        handleLocationChange("region", selected)
                      }
                      placeholder="Select cities (multiple selection allowed)"
                      noOptionsMessage={() =>
                        "No cities found for selected states"
                      }
                      className="w-full"
                      styles={customSelectStyles}
                      isDisabled={states.length === 0}
                    />
                    <ErrorMessage error={formErrors.region} />
                  </div>
                )}

                {locationVisibility.showCommunity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Community *
                    </label>
                    <Select
                      isMulti
                      options={
                        countries.includes("ALL_COUNTRIES") ||
                        states.includes("ALL_STATES") ||
                        cities.includes("ALL_CITIES")
                          ? [
                              {
                                value: "ALL_COMMUNITIES",
                                label: "🌐 All Communities",
                              },
                            ]
                          : newEvent.communityOptions || [] // use filtered communities stored in newEvent
                      }
                      value={newEvent.community}
                      onChange={(selected: MultiValue<Option>) =>
                        setNewEvent((prev: EventForm) => ({
                          ...prev,
                          community: [...selected] as (Option & {
                            type?: string;
                          })[],
                        }))
                      }
                      placeholder={
                        (newEvent.communityOptions?.length || 0) === 0
                          ? "Loading communities..."
                          : "Select Communities"
                      }
                      className="w-full"
                      styles={customSelectStyles}
                      isDisabled={locationVisibility.disableCommunity}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <div className="mb-6 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">
                      Access Memberships (
                      {newEvent.eventAccessType === "free" ? "RSVP" : "apply"})
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {newEvent.eventAccessType === "free"
                        ? "Select which membership types can access this free event (all selected will have free access)."
                        : newEvent.eventAccessType === "paid"
                        ? "Select which membership types need to pay for this event."
                        : "Select which membership types need to pay for this event (others will get free access if configured below)."}
                    </p>
                    {newEvent.eventAccessType !== "free-paid" && (
                      <div className="grid grid-cols-2 gap-3">
                        {MEMBERSHIP_OPTIONS.map((membership) => (
                          <label
                            key={membership.value}
                            className="flex items-center cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={
                                newEvent.eventAccessType === "free"
                                  ? newEvent.freeMemberships.includes(
                                      membership.value
                                    )
                                  : newEvent.paidMemberships.includes(
                                      membership.value
                                    )
                              }
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setNewEvent((prev: EventForm) => {
                                  if (prev.eventAccessType === "free") {
                                    return {
                                      ...prev,
                                      freeMemberships: isChecked
                                        ? [
                                            ...prev.freeMemberships,
                                            membership.value,
                                          ]
                                        : prev.freeMemberships.filter(
                                            (m) => m !== membership.value
                                          ),
                                    };
                                  } else {
                                    return {
                                      ...prev,
                                      paidMemberships: isChecked
                                        ? [
                                            ...prev.paidMemberships,
                                            membership.value,
                                          ]
                                        : prev.paidMemberships.filter(
                                            (m) => m !== membership.value
                                          ),
                                    };
                                  }
                                });
                              }}
                              className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <span className="text-sm">{membership.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {newEvent.eventAccessType === "free-paid" && (
                      <>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">
                            Free Access Memberships (RSVP)
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            Select membership types that will have free access
                            to this event.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {MEMBERSHIP_OPTIONS.map((membership) => (
                              <label
                                key={`free-${membership.value}`}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={newEvent.freeMemberships.includes(
                                    membership.value
                                  )}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setNewEvent((prev: EventForm) => ({
                                      ...prev,
                                      freeMemberships: isChecked
                                        ? [
                                            ...prev.freeMemberships,
                                            membership.value,
                                          ]
                                        : prev.freeMemberships.filter(
                                            (m) => m !== membership.value
                                          ),
                                      paidMemberships:
                                        prev.paidMemberships.filter(
                                          (m) => m !== membership.value
                                        ),
                                    }));
                                  }}
                                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <span className="text-sm">
                                  {membership.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium mb-2">
                            Paid Access Memberships (Apply)
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">
                            Select membership types that will need to pay for
                            this event.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {MEMBERSHIP_OPTIONS.map((membership) => (
                              <label
                                key={`paid-${membership.value}`}
                                className="flex items-center cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={newEvent.paidMemberships.includes(
                                    membership.value
                                  )}
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    setNewEvent((prev: EventForm) => ({
                                      ...prev,
                                      paidMemberships: isChecked
                                        ? [
                                            ...prev.paidMemberships,
                                            membership.value,
                                          ]
                                        : prev.paidMemberships.filter(
                                            (m) => m !== membership.value
                                          ),
                                      freeMemberships:
                                        prev.freeMemberships.filter(
                                          (m) => m !== membership.value
                                        ),
                                    }));
                                  }}
                                  className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                                <span className="text-sm">
                                  {membership.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {(newEvent.eventAccessType === "paid" ||
                      newEvent.eventAccessType === "free-paid") && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <input
                          ref={amountRef}
                          type="text"
                          name="amount"
                          value={newEvent.amount}
                          onChange={(e) => {
                            // Only allow numeric characters (digits only)
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            setNewEvent((prev: EventForm) => ({
                              ...prev,
                              amount: value,
                            }));
                          }}
                          placeholder="Enter Amount (₹)"
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                            formErrors.amount
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          } [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
                          required
                        />
                        <ErrorMessage error={formErrors.amount} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Image
                  </label>
                  {newEvent.imgPreview && (
                    <div className="mb-3">
                      <img
                        src={newEvent.imgPreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleImageUpload}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                      formErrors.img
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    accept="image/*"
                    required={!editingEvent}
                  />
                  <ErrorMessage error={formErrors.img} />
                  <p className="text-sm text-gray-500 mt-1">
                    {editingEvent
                      ? "Upload a new image to replace the existing one (optional, max 2MB)"
                      : "Select an image (max 2MB, required)"}
                  </p>
                  {newEvent.img && getImageSizeInMB() && (
                    <p
                      className={`text-xs mt-1 ${
                        Number(getImageSizeInMB()) > 2
                          ? "text-red-600 font-semibold"
                          : "text-green-600"
                      }`}
                    >
                      📦 Image size: {getImageSizeInMB()} MB
                    </p>
                  )}
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div ref={descriptionRef}>
                    <RichTextEditor
                      content={newEvent.description}
                      onChange={(content) =>
                        setNewEvent((prev: EventForm) => ({
                          ...prev,
                          description: content,
                        }))
                      }
                      placeholder="Enter event description..."
                      className="mb-2"
                    />
                  </div>
                  <ErrorMessage error={formErrors.description} />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Overview <span className="text-gray-500">(Optional)</span>
                  </label>
                  <textarea
                    name="eventOverview"
                    value={newEvent.eventOverview}
                    onChange={handleChange}
                    placeholder="Event Overview"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why Attend <span className="text-gray-500">(Optional)</span>
                  </label>
                  {newEvent.whyAttend.map((reason: string, index: number) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => {
                          const newWhyAttend = [...newEvent.whyAttend];
                          newWhyAttend[index] = e.target.value;
                          setNewEvent((prev: EventForm) => ({
                            ...prev,
                            whyAttend: newWhyAttend,
                          }));
                        }}
                        placeholder={`Reason ${index + 1}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2"
                      />
                      {newEvent.whyAttend.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newWhyAttend = newEvent.whyAttend.filter(
                              (_: string, i: number) => i !== index
                            );
                            setNewEvent((prev: EventForm) => ({
                              ...prev,
                              whyAttend: newWhyAttend,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors px-3 py-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNewEvent((prev: EventForm) => ({
                        ...prev,
                        whyAttend: [...prev.whyAttend, ""],
                      }))
                    }
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    Add Reason
                  </button>
                </div>
              </div>

              <div className="w-full bg-white p-4 border-t border-gray-200 mt-6">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Processing..."
                    : editingEvent
                    ? "Update Event"
                    : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
