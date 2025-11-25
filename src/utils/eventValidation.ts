import { isAfter } from "date-fns";

import { EventForm, Event } from "../EventInterface/EventInterface";

export const validateEventForm = (
  newEvent: EventForm,
  editingEvent: Event | null
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  const now = new Date();

  // --- Edit flow: only validate eventName ---
  if (editingEvent) {
    if (!newEvent.eventName.trim())
      errors.eventName = "Event name is required.";
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  const {
    eventType,
    date,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    onlineLink,
    amount,
    eventName,
    description,
    img,
    eventAccessType,
  } = newEvent;

  // Basic required fields
  if (!eventName.trim()) errors.eventName = "Please fill out this field.";
  if (!description.trim()) errors.description = "Please fill out this field.";

  // Event type-specific validation
  if (eventType === "onedayevent") {
    if (!date) {
      errors.date = "Please fill out this field.";
    } else if (isNaN(new Date(date).getTime())) {
      errors.date = "Invalid date.";
    } else if (!isAfter(new Date(date), now)) {
      errors.date = "Event date must be in the future.";
    }

    if (!startTime) errors.startTime = "Please fill out this field.";
    if (!endTime) errors.endTime = "Please fill out this field.";
    if (!location) errors.location = "Please fill out this field.";
  } else if (eventType === "onlineevent") {
    if (!date) {
      errors.date = "Please fill out this field.";
    } else if (isNaN(new Date(date).getTime())) {
      errors.date = "Invalid date.";
    } else if (!isAfter(new Date(date), now)) {
      errors.date = "Event date must be in the future.";
    }

    if (!startTime) errors.startTime = "Please fill out this field.";
    if (!endTime) errors.endTime = "Please fill out this field.";
    if (!onlineLink) errors.onlineLink = "Please fill out this field.";
  } else if (eventType === "tripevent") {
    const startObj = startDate ? new Date(startDate) : null;
    const endObj = endDate ? new Date(endDate) : null;

    if (!startDate) {
      errors.startDate = "Please fill out this field.";
    } else if (isNaN(startObj!.getTime())) {
      errors.startDate = "Invalid start date.";
    } else if (!isAfter(startObj!, now)) {
      errors.startDate = "Start date must be in the future.";
    }

    if (!endDate) {
      errors.endDate = "Please fill out this field.";
    } else if (isNaN(endObj!.getTime())) {
      errors.endDate = "Invalid end date.";
    } else if (startObj && endObj && !isAfter(endObj, startObj)) {
      errors.endDate = "End date must be after start date.";
    }

    if (!location) errors.location = "Please fill out this field.";
  }

  // Image validation
  if (!img) errors.img = "Please fill out this field.";
  else if (img.size && img.size / (1024 * 1024) > 2)
    errors.img = "Image must be less than 2MB.";

  // Paid/free-paid amount
  if (
    (eventAccessType === "paid" || eventAccessType === "free-paid") &&
    (!amount || Number(amount) <= 0)
  )
    errors.amount = "Please fill out this field.";

  return { isValid: Object.keys(errors).length === 0, errors };
};
