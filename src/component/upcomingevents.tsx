import React, { useState, useEffect } from "react";
import api from "../api/api";
import { Calendar, Clock, MapPin, FileText, Link } from "react-feather";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Event {
  _id: string;
  name?: string;
  eventName?: string;
  date?: string;
  eventDate?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  eventTime?: string;
  time?: string;
  location?: string;
  destination?: string;
  onlineLink?: string;
  description: string;
  img?: string;
  eventImg?: string;
}

const UpcomingEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await api.get("/dashboard/upcoming-events");
        const data = response.data;

        if (data.success) {
          setEvents(data.data);
        } else {
          throw new Error("No upcoming events found.");
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Something went wrong!");
        toast.error(error.response?.data?.message || "⚠️ Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Helper function to format date
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString(undefined, options);
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Upcoming Events</h2>

      {/* Loading & Error Handling */}
      {loading && <p className="text-center text-blue-600">Loading upcoming events...</p>}
      {error && <p className="text-center text-red-600">Error: {error}</p>}

      {/* Event Cards */}
      {!loading && !error && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event._id} className="p-6 bg-white shadow-lg rounded-lg">
              {/* Event Image */}
              {event.img && (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/image/${event.img}`}
                  alt={event.name || event.eventName}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}
              {event.eventImg && (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL}/image/${event.eventImg}`}
                  alt={event.name || event.eventName}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
              )}

              {/* Event Title */}
              <h3 className="text-lg font-bold">{event.name || event.eventName}</h3>

              {/* Event Date & Time */}
              <div className="space-y-2 mt-2">
                <p className="flex items-center text-gray-600">
                  <Calendar className="mr-2" size={16} />
                  {event.startDate
                    ? formatDateTime(event.startDate)
                    : "Date not available"}
                  {event.endDate && ` - ${formatDateTime(event.endDate)}`}
                </p>
                <p className="flex items-center text-gray-600">
                  <Clock className="mr-2" size={16} /> 
                  {event.startTime || "Time not available"}
                </p>
                {event.onlineLink ? (
                  <p className="flex items-center text-gray-600">
                    <Link className="mr-2" size={16} /> 
                    <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Join Online
                    </a>
                  </p>
                ) : (
                  <p className="flex items-center text-gray-600">
                    <MapPin className="mr-2" size={16} /> 
                    {event.location || event.destination || "Location not available"}
                  </p>
                )}
                <p className="flex items-center text-gray-700">
                  <FileText className="mr-2" size={16} /> {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && <p className="text-center text-gray-600">No upcoming events available.</p>
      )}
      <ToastContainer />
    </div>
  );
};

export default UpcomingEvents;