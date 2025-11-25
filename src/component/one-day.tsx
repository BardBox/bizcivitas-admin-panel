import React, { useState, useEffect, useRef } from "react";
import { X, Edit2, Trash2, Calendar, Globe, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import Modal from "react-modal";
import { useVisibility } from "../context/VisibilityContext";
import api from "../api/api";
// Removed unused imports: City, State from country-state-city
import Select, { MultiValue, StylesConfig } from "react-select";
import { AxiosError } from "axios";
import { format, parseISO } from "date-fns";

Modal.setAppElement("#root");
const SERVER_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// Interfaces and types
interface Option {
  value: string;
  label: string;
}
interface Community {
  _id: string;
  name: string;
  status: string;
}
interface Event {
  _id: string;
  img?: string;
  eventName: string;
  date?: string;
  startTime: string;
  endTime: string;
  location?: string;
  onlineLink?: string;
  startDate?: string;
  endDate?: string;
  description: string;
  communities: { _id: string; name: string }[];
  region: string[];
  state: string[];
  subtitle: string;
  eventOverview: string;
  whyAttend: string[];
  isPaid: boolean;
  amount?: number;
  membershipType: string[];
  eventType: "onedayevent" | "onlineevent" | "tripevent";
}
interface EventForm {
  img: File | null;
  imgPreview: string | null;
  imgChanged: boolean;
  eventName: string;
  description: string;
  location: string;
  onlineLink: string;
  date: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  community: MultiValue<Option>;
  region: MultiValue<Option>;
  state: MultiValue<Option>;
  subtitle: string;
  eventOverview: string;
  whyAttend: string[];
  isPaid: boolean;
  membershipType: MultiValue<Option>;
  amount: string;
  eventType: "onedayevent" | "onlineevent" | "tripevent";
}
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Custom styles for react-select
const customSelectStyles: StylesConfig<Option, true> = {
  control: (provided) => ({
    ...provided,
    borderRadius: "8px",
    borderColor: "#e2e8f0",
    padding: "4px",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#2563eb",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e0f2fe",
    borderRadius: "4px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#1e40af",
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
  }),
};

// Helper functions
const formatDateForInput = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date:", isoDate, error);
    return "";
  }
};
const convertTo24HourFormat = (timeStr: string): string => {
  if (!timeStr) return "";
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  let hoursNum = parseInt(hours, 10);
  if (modifier === "PM" && hoursNum !== 12) {
    hoursNum += 12;
  } else if (modifier === "AM" && hoursNum === 12) {
    hoursNum = 0;
  }
  return `${hoursNum.toString().padStart(2, "0")}:${minutes}`;
};

// Main Component
const AdminEvents: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [events, setEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isDateDisabled, setIsDateDisabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Filter states
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "free">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Remove hardcoded India states - make it empty by default
  const [stateOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const eventTypeOptions: Option[] = [
    { value: "onedayevent", label: "One Day Event" },
    { value: "onlineevent", label: "Online Event" },
    { value: "tripevent", label: "Trip Event" },
  ];
  const membershipOptions: Option[] = [
    { value: "Core Membership", label: "Core Membership" },
    { value: "Flagship Membership", label: "Flagship Membership" },
    { value: "Industria Membership", label: "Industria Membership" },
    { value: "Digital Membership", label: "Digital Membership" },
  ];
  const defaultEventState: EventForm = {
    img: null,
    imgPreview: null,
    imgChanged: false,
    eventName: "",
    description: "",
    location: "",
    onlineLink: "",
    date: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    community: [],
    region: [],
    state: [],
    subtitle: "",
    eventOverview: "",
    whyAttend: [""],
    isPaid: false,
    membershipType: [],
    amount: "",
    eventType: "onedayevent",
  };
  const [newEvent, setNewEvent] = useState<EventForm>(defaultEventState);

  // Hide sidebar and header when form or delete confirmation is open
  useEffect(() => {
    setSidebarAndHeaderVisibility(!showForm && !showDeleteConfirm);
    return () => {
      setSidebarAndHeaderVisibility(true);
    };
  }, [showForm, showDeleteConfirm, setSidebarAndHeaderVisibility]);

  useEffect(() => {
    // Cities are disabled since there's no country selection in this component
    // Keep empty to prevent automatic population
    setCityOptions([]);
    if (newEvent.state.length === 0) {
      setNewEvent((prev) => ({ ...prev, region: [] }));
    }
  }, [newEvent.state]);

  useEffect(() => {
    fetchEvents();
    fetchCommunities();
  }, [
    selectedStates,
    selectedCommunities,
    selectedEventTypes,
    dateRange,
    paidFilter,
  ]);

  const fetchEvents = async () => {
    try {
      setIsFetching(true);
      const params: Record<string, any> = {
        state: selectedStates.length > 0 ? selectedStates : undefined,
        community:
          selectedCommunities.length > 0 ? selectedCommunities : undefined,
        eventType:
          selectedEventTypes.length > 0 ? selectedEventTypes : undefined,
      };
      if (dateRange.start && dateRange.end) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }
      if (paidFilter !== "all") {
        params.isPaid = paidFilter === "paid";
      }
      const response = await api.get<ApiResponse<Event[]>>("/events/event", {
        params,
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
        setEvents(formattedEvents);
      } else {
        toast.error(response.data.message || "Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          "Failed to load events"
      );
    } finally {
      setIsFetching(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await api.get<ApiResponse<Community[]>>("/community/");
      if (response.data.success && Array.isArray(response.data.data)) {
        setCommunities(response.data.data.filter((c) => c.status === "active"));
      } else {
        toast.error(response.data.message || "Failed to fetch communities");
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          "Failed to load communities"
      );
    }
  };

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("eventName", newEvent.eventName);
      formData.append("description", newEvent.description);
      formData.append(
        "communities",
        JSON.stringify(newEvent.community.map((c) => c.value))
      );
      formData.append(
        "region",
        JSON.stringify(newEvent.region.map((r) => r.value))
      );
      formData.append(
        "state",
        JSON.stringify(newEvent.state.map((s) => s.value))
      );
      formData.append("subtitle", newEvent.subtitle);
      formData.append("eventOverview", newEvent.eventOverview);
      formData.append("startTime", newEvent.startTime);
      formData.append("endTime", newEvent.endTime);
      formData.append("isPaid", String(newEvent.isPaid));
      formData.append(
        "membershipType",
        JSON.stringify(newEvent.membershipType.map((m) => m.value))
      );
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
      if (newEvent.isPaid) {
        formData.append("amount", newEvent.amount);
      }
      newEvent.whyAttend
        .filter((reason) => reason.trim() !== "")
        .forEach((reason, index) => {
          formData.append(`whyAttend[${index}]`, reason);
        });
      if (newEvent.imgChanged && newEvent.img instanceof File) {
        formData.append("img", newEvent.img);
      }
      let response;
      if (editingEvent) {
        response = await api.put<ApiResponse<unknown>>(
          `/events/event/edit/${editingEvent._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Event updated successfully!");
      } else {
        response = await api.post<ApiResponse<{ _id: string }>>(
          "/events/event/create",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Event created successfully!");
      }
      if (response.data.success) {
        fetchEvents();
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
      resetForm();
      setShowForm(false);
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
    setNewEvent(defaultEventState);
    setEditingEvent(null);
    setIsDateDisabled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (newEvent.imgPreview && newEvent.imgChanged) {
      URL.revokeObjectURL(newEvent.imgPreview);
    }
  };

  const handleEdit = (event: Event) => {
    const imageUrl = event.img ? `${SERVER_URL}/image/${event.img}` : null;
    const startTime24 = event.startTime
      ? convertTo24HourFormat(event.startTime)
      : "";
    const endTime24 = event.endTime ? convertTo24HourFormat(event.endTime) : "";
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
      startTime: startTime24,
      endTime: endTime24,
      community: event.communities.map((c) => ({
        value: c._id,
        label: c.name,
      })),
      region: event.region.map((r) => ({ value: r, label: r })),
      state: event.state.map((s) => ({ value: s, label: s })),
      subtitle: event.subtitle || "",
      eventOverview: event.eventOverview || "",
      whyAttend: event.whyAttend.length > 0 ? event.whyAttend : [""],
      isPaid: event.isPaid || false,
      membershipType: Array.isArray(event.membershipType)
        ? event.membershipType.map((m) => ({ value: m, label: m }))
        : event.membershipType
        ? [{ value: event.membershipType, label: event.membershipType }]
        : [],
      amount: event.amount ? String(event.amount) : "",
      eventType: event.eventType,
    });
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
        setEvents(events.filter((event) => event._id !== eventId));
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "onedayevent":
        return <Calendar className="inline mr-1" size={16} />;
      case "onlineevent":
        return <Globe className="inline mr-1" size={16} />;
      case "tripevent":
        return <MapPin className="inline mr-1" size={16} />;
      default:
        return <Calendar className="inline mr-1" size={16} />;
    }
  };

  const getEventTypeName = (eventType: string) => {
    switch (eventType) {
      case "onedayevent":
        return "One Day Event";
      case "onlineevent":
        return "Online Event";
      case "tripevent":
        return "Trip Event";
      default:
        return "Event";
    }
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
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Filters
        </button>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Event
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="text-lg font-semibold mb-2">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              isMulti
              options={stateOptions}
              placeholder="Filter by State"
              onChange={(selected) =>
                setSelectedStates(selected.map((s) => s.value))
              }
            />
            <Select
              isMulti
              options={communities.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
              placeholder="Filter by Community"
              onChange={(selected) =>
                setSelectedCommunities(selected.map((s) => s.value))
              }
            />
            <Select
              isMulti
              options={eventTypeOptions}
              placeholder="Filter by Event Type"
              onChange={(selected) =>
                setSelectedEventTypes(selected.map((s) => s.value))
              }
            />
            <select
              onChange={(e) =>
                setPaidFilter(e.target.value as "all" | "paid" | "free")
              }
              className="p-2 border rounded"
            >
              <option value="all">All Payment Types</option>
              <option value="paid">Paid Events</option>
              <option value="free">Free Events</option>
            </select>
            <input
              type="date"
              placeholder="Start Date"
              className="p-2 border rounded"
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <input
              type="date"
              placeholder="End Date"
              className="p-2 border rounded"
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((event) => {
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
                className="p-6 bg-white shadow-md rounded-lg"
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
                  {getEventIcon(event.eventType)}
                  <span className="text-sm font-medium text-gray-600">
                    {getEventTypeName(event.eventType)}
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
                  <span className="font-medium">Time:</span> {event.startTime} -{" "}
                  {event.endTime}
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
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Price:</span>{" "}
                  {event.isPaid && event.amount ? `₹${event.amount}` : "Free"}
                </p>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => handleEdit(event)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Edit2 className="inline mr-2" size={16} /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(event._id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    disabled={isLoading}
                  >
                    <Trash2 className="inline mr-2" size={16} /> Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500 py-12">
            No events found matching your criteria.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[400px]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => eventToDelete && handleDelete(eventToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered and Responsive Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <div className="flex gap-4">
                    {eventTypeOptions.map((type) => (
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Name
                  </label>
                  <input
                    type="text"
                    name="eventName"
                    value={newEvent.eventName}
                    onChange={handleChange}
                    placeholder="Event Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtitle
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
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!!editingEvent && isDateDisabled}
                    />
                  </div>
                )}
                {newEvent.eventType === "tripevent" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={newEvent.startDate}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!!editingEvent && isDateDisabled}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={newEvent.endDate}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!!editingEvent && isDateDisabled}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={newEvent.startTime}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={newEvent.endTime}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {newEvent.eventType !== "onlineevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={newEvent.location}
                      onChange={handleChange}
                      placeholder="Location"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                {newEvent.eventType === "onlineevent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Online Link
                    </label>
                    <input
                      type="text"
                      name="onlineLink"
                      value={newEvent.onlineLink}
                      onChange={handleChange}
                      placeholder="https://example.com/meeting"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <Select
                    isMulti
                    options={stateOptions}
                    value={newEvent.state}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({ ...prev, state: selected }))
                    }
                    placeholder="Select States"
                    className="w-full"
                    styles={customSelectStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region (City)
                  </label>
                  <Select
                    isMulti
                    options={cityOptions}
                    value={newEvent.region}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({ ...prev, region: selected }))
                    }
                    placeholder="Select Regions"
                    className="w-full"
                    styles={customSelectStyles}
                    isDisabled={newEvent.state.length === 0}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community
                  </label>
                  <Select
                    isMulti
                    options={[
                      { value: "ALL", label: "All Communities" },
                      ...communities.map((c) => ({
                        value: c._id,
                        label: c.name,
                      })),
                    ]}
                    value={newEvent.community}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({ ...prev, community: selected }))
                    }
                    placeholder="Select Communities"
                    className="w-full"
                    styles={customSelectStyles}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membership Type
                  </label>
                  <Select
                    isMulti
                    options={membershipOptions}
                    value={newEvent.membershipType}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        membershipType: selected,
                      }))
                    }
                    placeholder="Select Membership Types"
                    className="w-full"
                    styles={customSelectStyles}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={newEvent.isPaid}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Is Paid Event
                  </label>
                </div>
                {newEvent.isPaid && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={newEvent.amount}
                      onChange={handleChange}
                      placeholder="Enter Amount (₹)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    accept="image/*"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {editingEvent
                      ? "Upload a new image or keep the existing one"
                      : "Select an image (max 2MB)"}
                  </p>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Overview
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
                    Why Attend
                  </label>
                  {newEvent.whyAttend.map((reason, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => {
                          const newWhyAttend = [...newEvent.whyAttend];
                          newWhyAttend[index] = e.target.value;
                          setNewEvent((prev) => ({
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
                              (_, i) => i !== index
                            );
                            setNewEvent((prev) => ({
                              ...prev,
                              whyAttend: newWhyAttend,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNewEvent((prev) => ({
                        ...prev,
                        whyAttend: [...prev.whyAttend, ""],
                      }))
                    }
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Add Reason
                  </button>
                </div>
              </div>
              <div className="w-full bg-white p-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-300"
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
