import React, { useState } from "react";
import axios from "axios";

// Define the event object type
interface Event {
  title: string;
  date: string;
  time: string;
  content: string;
  image: File | null;
  address: string; // Added address field
}

const EventCreation = () => {
  const [event, setEvent] = useState<Event>({
    title: "",
    date: "",
    time: "",
    content: "",
    image: null,
    address: "", // Initialize address
  });

  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState<string | null>(null); // Track error state

  // Handle change for text input fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEvent((prevEvent) => ({
      ...prevEvent,
      [name]: value,
    }));
  };

  // Handle change for image input field
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Selected File:", files[0]); // Debugging
      setEvent((prevEvent) => ({
        ...prevEvent,
        image: files[0],
      }));
    } else {
      console.log("No file selected");
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset error

    console.log("Event State:", event); // Debugging

    // Validate required fields
    if (
      !event.title ||
      !event.content ||
      !event.address ||
      !event.date ||
      !event.time ||
      !event.image
    ) {
      alert("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("eventImage", event.image);
    formData.append("title", event.title);
    formData.append("description", event.content); // Corrected spelling
    formData.append("address", event.address);
    formData.append("date", event.date);
    formData.append("time", event.time);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/events/createEvent`,
        formData
      );

      console.log("response:", response);

      alert("Event Created Successfully!");
      setEvent({
        title: "",
        date: "",
        time: "",
        content: "",
        image: null,
        address: "",
      });
    } catch (err: any) {
      console.error("Error response:", err.response?.data || err.message);
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Title
          </label>
          <input
            type="text"
            name="title"
            value={event.title}
            onChange={handleChange}
            placeholder="Enter event title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Event Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Date
          </label>
          <input
            type="date"
            name="date"
            value={event.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Event Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Time
          </label>
          <input
            type="time"
            name="time"
            value={event.time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Event Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Content
          </label>
          <textarea
            name="content"
            value={event.content}
            onChange={handleChange}
            placeholder="Write event description here"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        {/* Event Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Address
          </label>
          <input
            type="text"
            name="address"
            value={event.address}
            onChange={handleChange}
            placeholder="Enter event address"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Event Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {event.image && (
            <p className="mt-2 text-sm text-gray-600">
              Selected File: {event.image.name}
            </p>
          )}
        </div>

        {/* Error and Loading States */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {loading && <p className="text-blue-500 text-sm">Creating event...</p>}

        {/* Create Event Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading} // Disable the button while loading
        >
          {loading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
};

export default EventCreation;
