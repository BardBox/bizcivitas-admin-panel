import { format, parseISO } from "date-fns";
import { Calendar, Globe, MapPin } from "lucide-react";
import React from "react";

/**
 * Formats an ISO date string to YYYY-MM-DD format for input fields
 * @param isoDate - The ISO date string to format
 * @returns Formatted date string or empty string if error occurs
 */
export const formatDateForInput = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date:", isoDate, error);
    return "";
  }
};

/**
 * Returns the appropriate icon component for an event type
 * @param eventType - The type of event ("onedayevent", "onlineevent", "tripevent")
 * @returns React element with the corresponding icon
 */
export const getEventIcon = (eventType: string): React.ReactElement => {
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

/**
 * Returns the human-readable name for an event type
 * @param eventType - The type of event ("onedayevent", "onlineevent", "tripevent")
 * @returns Human-readable event type name
 */
export const getEventTypeName = (eventType: string): string => {
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