import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiX, FiTrash2 } from "react-icons/fi";
import { useVisibility } from "../../context/VisibilityContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../api/api";

// Update the Community interface to match the API response and handle potential 'communityName'
interface Community {
  _id: string;
  name: string; // Primary name property
  communityName?: string; // Fallback if API uses this
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
  country: string;
  state: string;
  city: string;
  targetId: string;
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
    country: "",
    state: "",
    city: "",
    targetId: "",
    targetType: "",
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [countries] = useState<string[]>(["IN"]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [entities, setEntities] = useState<Community[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterCommunity, setFilterCommunity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB max image size

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Helper function to safely get community name
  const getCommunityName = (
    community: Community | null | undefined
  ): string => {
    if (!community) return "Unknown";
    return community.name || community.communityName || "Unknown";
  };

  // Helper function to safely get community type
  const getCommunityType = (
    community: Community | null | undefined
  ): string => {
    if (!community) return "Unknown";
    return community.type || "Unknown";
  };

  useEffect(() => {
    setSidebarAndHeaderVisibility(!isModalOpen);
  }, [isModalOpen, setSidebarAndHeaderVisibility]);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await api.get("/meetings");
        if (response.data.success) {
          const validMeetings = response.data.data
            .filter((meeting: any) => meeting && meeting._id) // Filter out invalid meetings
            .map((meeting: any) => {
              // Safely handle community mapping with fallbacks for both 'name' and 'communityName'
              const communityData = meeting.community;
              const safeCommunity: Community = communityData
                ? {
                    _id: communityData._id || "",
                    name:
                      communityData.name ||
                      communityData.communityName ||
                      "Unknown",
                    communityName: communityData.communityName, // Preserve if present
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
        } else {
          toast.error(response.data.message || "Failed to fetch meetings.");
        }
      } catch (error) {
        console.error("Fetch meetings error:", error);
        toast.error("Failed to fetch meetings.");
      }
    };

    fetchMeetings();
  }, []);

  const fetchEntities = async (filters: {
    country?: string;
    state?: string;
    city?: string;
  }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/meetings/entities?${params}`);
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
        setEntities(mappedEntities);
        if (filters.country && !filters.state) {
          setStates([
            ...new Set(
              mappedEntities.flatMap((e: Community) => e.states || [])
            ),
          ]);
        }
        if (filters.state && !filters.city) {
          setCities([
            ...new Set(
              mappedEntities.flatMap((e: Community) => e.cities || [])
            ),
          ]);
        }
      } else {
        setEntities([]);
        setStates([]);
        setCities([]);
        toast.error(response.data.message || "Failed to fetch entities.");
      }
    } catch (error) {
      console.error("Fetch entities error:", error);
      setEntities([]);
      setStates([]);
      setCities([]);
      toast.error("Failed to fetch entities.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openModal = (meeting: Meeting | null = null) => {
    if (meeting) {
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
        country: "IN",
        state: "",
        city: "",
        targetId: meeting.community?._id || "",
        targetType:
          (meeting.community?.type as "Community" | "CoreGroup") || "",
      });
      setImagePreview(
        meeting.img
          ? `${import.meta.env.VITE_API_BASE_URL}/image/${meeting.img}`
          : null
      );
      setSelectedMeeting(meeting);
      if (meeting.community?._id) {
        fetchEntities({ country: "IN", state: "", city: "" });
      }
    } else {
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
        country: "",
        state: "",
        city: "",
        targetId: "",
        targetType: "",
      });
      setImagePreview(null);
      setSelectedMeeting(null);
      setStates([]);
      setCities([]);
      setEntities([]);
    }
    setIsModalOpen(true);
  };

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

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      country: value,
      state: "",
      city: "",
      targetId: "",
      targetType: "",
    }));
    setStates([]);
    setCities([]);
    setEntities([]);
    if (value) {
      fetchEntities({ country: value });
    }
  };

  const handleStateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      city: "",
      targetId: "",
      targetType: "",
    }));
    setCities([]);
    setEntities([]);
    if (value) {
      fetchEntities({ country: formData.country, state: value });
    }
  };

  const handleCityChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      city: value,
      targetId: "",
      targetType: "",
    }));
    setEntities([]);
    if (value) {
      fetchEntities({
        country: formData.country,
        state: formData.state,
        city: value,
      });
    }
  };

  const handleEntityChange = (value: string) => {
    const selectedEntity = entities.find((entity) => entity._id === value);
    setFormData((prev) => ({
      ...prev,
      targetId: value,
      targetType: selectedEntity?.type || "",
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.visitor ||
      !formData.speaker ||
      !formData.agenda ||
      !formData.date ||
      !formData.place ||
      !formData.time ||
      !formData.country ||
      !formData.state ||
      !formData.targetId
    ) {
      toast.error("All required fields must be filled.");
      return;
    }

    if (!selectedMeeting && !formData.img) {
      toast.error("Please upload an image for the meeting.");
      return;
    }

    const selectedDate = new Date(formData.date);
    const selectedTime = formData.time.split(":").map(Number);
    selectedDate.setHours(selectedTime[0], selectedTime[1], 0, 0);

    if (selectedDate <= new Date()) {
      toast.error("Date and time must be in the future.");
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
      formDataToSend.append(
        "targets",
        JSON.stringify([
          { targetId: formData.targetId, targetType: formData.targetType },
        ])
      );

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
        country: "",
        state: "",
        city: "",
        targetId: "",
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

  const handleDelete = (id: string) => {
    setConfirmDelete(id);
  };

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

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const filteredMeetings = filterCommunity
    ? meetings.filter(
        (meeting) => meeting && meeting.community?._id === filterCommunity
      )
    : meetings.filter((meeting) => meeting); // Filter out any null/undefined meetings

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
        `}
      </style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-gray-700">Filter by Community:</label>
          <select
            value={filterCommunity}
            onChange={(e) => setFilterCommunity(e.target.value)}
            className="border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Communities</option>
            {entities
              .filter((entity) => entity && entity._id)
              .map((entity) => (
                <option key={entity._id} value={entity._id}>
                  {getCommunityName(entity)} ({getCommunityType(entity)})
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
                          ? `${getCommunityName(
                              meeting.community
                            )} (${getCommunityType(meeting.community)})`
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
                <label className="block text-gray-700">Visitor Count *</label>
                <input
                  type="number"
                  name="visitor"
                  value={formData.visitor}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Speaker Count *</label>
                <input
                  type="number"
                  name="speaker"
                  value={formData.speaker}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="1"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Country *</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">State *</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.country}
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">City</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.state}
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-gray-700">Entity *</label>
                <select
                  name="targetId"
                  value={formData.targetId}
                  onChange={(e) => handleEntityChange(e.target.value)}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.city}
                >
                  <option value="">Select Entity</option>
                  {entities
                    .filter((entity) => entity && entity._id)
                    .map((entity) => (
                      <option key={entity._id} value={entity._id}>
                        {getCommunityName(entity)} ({getCommunityType(entity)})
                      </option>
                    ))}
                </select>
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
