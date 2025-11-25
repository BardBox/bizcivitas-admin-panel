// =========================
// ✅ EVENT INTERFACE TYPES
// =========================

export interface Option {
  value: string;
  label: string;
  country?: string;
  state?: string;
}

export interface GroupedOption {
  label: string;
  options: Option[];
}

export interface Community {
  _id: string;
  name: string;
  status?: string;
  type?: string;
}

export type AccessType = 'free' | 'paid';

export interface MembershipAccess {
  membership: string;
  accessType: AccessType;
  type: AccessType;
}

export type EventType = 'onedayevent' | 'onlineevent' | 'tripevent';
export type EventAccessType = 'free' | 'paid' | 'free-paid';

export interface Event {
  _id: string;
  eventName: string;
  description?: string;
  subtitle?: string;
  eventOverview?: string;
  whyAttend?: string[] | string;
  location?: string;
  onlineLink?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  communities: Community[]; // Linked communities
  region?: string[] | string;
  state: string[] | string;
  country: string | string[];
  isPaid?: boolean;
  amount?: number;
  eventType: EventType;
  membershipType?: string[];
  membershipAccessType: MembershipAccess[];
  accessMode?: EventAccessType;
  totalParticipants?: number;
  totalPending?: number;
  approvedByAdmin?: string[];
  img?: string; // Image URL

  // ✅ Added property to fix TS error
  targets?: {
    targetId: string;
    targetType: string;
    name?: string;
  }[];
}

// =========================
// ✅ EVENT FORM INTERFACE
// =========================

export interface EventForm {
  img: File | null;
  imgPreview: string | null;
  imgChanged: boolean;

  communityOptions?: Option[];
  eventName: string;
  description: string;
  location: string;
  onlineLink: string;
  date: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  subtitle: string;
  eventOverview: string;

  whyAttend: string[];
  isPaid: boolean;

  community: Array<Option & { type?: string }>;
  region: Option[];
  state: Option[];
  country: Option[];

  membershipType: Option[];
 
  eventAccessType: EventAccessType;
membershipAccessType?: Array<{
    membership: string;
    accessType: AccessType;
    type: AccessType;
  }>;
  freeMemberships: string[];
  paidMemberships: string[];

  communityFreeAccess: Array<{
    communityId: string;
    freeAccessType: string;
    countries: string[];
    states: string[];
    cities: string[];
  }>;

  freeAccessCountries: string[];
  freeAccessStates: string[];
  freeAccessCities: Option[];
  freeAccessCommunities: string[];

  amount: string;
  eventType: EventType;
}

// =========================
// ✅ GENERIC API RESPONSE
// =========================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
