// Event-related constants
export const SERVER_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export const EVENT_TYPE_OPTIONS = [
  { value: "onedayevent", label: "One Day Event" },
  { value: "onlineevent", label: "Online Event" },
  { value: "tripevent", label: "Trip Event" },
];

export const MEMBERSHIP_OPTIONS = [
  { value: "Core Membership", label: "Core Membership" },
  { value: "Flagship Membership", label: "Flagship Membership" },
  { value: "Industria Membership", label: "Industria Membership" },
  { value: "Digital Membership", label: "Digital Membership" },
];

export const DEFAULT_EVENT_STATE = {
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
  country: [],
  subtitle: "",
  eventOverview: "",
  whyAttend: [""],
  isPaid: false,
  membershipType: [],
  membershipAccessType: [
    {
      membership: "Core Membership",
      accessType: "free" as const,
      type: "free" as const,
    },
    {
      membership: "Flagship Membership",
      accessType: "free" as const,
      type: "free" as const,
    },
    {
      membership: "Industria Membership",
      accessType: "free" as const,
      type: "free" as const,
    },
    {
      membership: "Digital Membership",
      accessType: "free" as const,
      type: "free" as const,
    },
  ],
  eventAccessType: "free" as const,
  freeMemberships: [],
  paidMemberships: [],
  // Initialize new community-specific free access fields
  communityFreeAccess: [],
  freeAccessCountries: [],
  freeAccessStates: [],
  freeAccessCities: [],
  freeAccessCommunities: [],
  amount: "",
  eventType: "onedayevent" as const,
};
