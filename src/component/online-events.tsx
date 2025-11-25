import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { useVisibility } from '../context/VisibilityContext';
import api from '../api/api';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { City, State } from 'country-state-city';
import { AxiosError } from 'axios';
import { format, parseISO } from 'date-fns';

Modal.setAppElement('#root');

const SERVER_URL = 'https://backend.bizcivitas.com/api/v1';

const NOTIFICATION_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Interfaces
interface Option {
  value: string;
  label: string;
}

interface Community {
  _id: string;
  communityName: string;
}

interface Event {
  _id: string;
  img?: string;
  eventName: string;
  description: string;
  onlineLink: string;
  date: string;
  startTime: string;
  endTime?: string;
  region: string[];
  state: string[];
  communities: { _id: string; name: string }[];
  eventOverview: string;
  subtitle: string;
  whyAttend: string[];
  isPaid: boolean;
  amount?: string;
  membershipType: string[];
  totalParticipants?: number;
  participants?: Array<{
    _id: string;
    fname: string;
    lname?: string;
    email: string;
    mobile?: string;
    paymentStatus?: string;
    amountPaid?: number;
  }>;
}

interface NotificationResponse {
  notifications: {
    userId: string;
    messageTitle: string;
    messageBody: string;
    isUnread: boolean;
    type: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }[];
  successCount: number;
  failureCount: number;
  totalRecipients: number;
  eventIds: string[];
}

interface EventForm {
  img: File | null;
  imgPreview: string | null;
  imgChanged: boolean;
  eventName: string;
  description: string;
  onlineLink: string;
  date: string;
  startTime: string;
  endTime?: string;
  region: MultiValue<Option>;
  state: MultiValue<Option>;
  community: MultiValue<Option>;
  eventOverview: string;
  subtitle: string;
  whyAttend: string[];
  isPaid: boolean;
  amount: string;
  membershipType: MultiValue<Option>;
}

interface Errors {
  img?: string;
  imgPreview?: string; // Added to fix TS7053
  imgChanged?: string; // Added to fix TS7053
  eventName?: string;
  subtitle?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  onlineLink?: string;
  region?: string;
  state?: string;
  community?: string;
  eventOverview?: string;
  whyAttend?: string;
  amount?: string;
  membershipType?: string;
  description?: string;
  isPaid?: string;
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
    borderRadius: '8px',
    borderColor: '#e2e8f0',
    padding: '4px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#2563eb',
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e0f2fe',
    borderRadius: '4px',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: '#1e40af',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: '#1e40af',
    '&:hover': {
      backgroundColor: '#bfdbfe',
      color: '#1e3a8a',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9ca3af',
  }),
};

// Format date to YYYY-MM-DD for input fields
const formatDateForInput = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', isoDate, error);
    return '';
  }
};

// Format date for display (e.g., "June 6, 2025")
const formatDateForDisplay = (isoDate: string): string => {
  try {
    return format(parseISO(isoDate), 'MMMM d, yyyy');
  } catch (error) {
    console.error('Error formatting date:', isoDate, error);
    return isoDate;
  }
};

const OnlineEvents: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [events, setEvents] = useState<Event[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedState, setSelectedState] = useState<string[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string[]>([]);
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string>('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const stateOptions: Option[] = State.getStatesOfCountry('IN').map((state) => ({
    value: state.name,
    label: state.name,
  }));

  const [cityOptions, setCityOptions] = useState<Option[]>([]);

  const membershipOptions: Option[] = [
    { value: 'Core Membership', label: 'Core Membership' },
    { value: 'Flagship Membership', label: 'Flagship Membership' },
    { value: 'Industria Membership', label: 'Industria Membership' },
    { value: 'Digital Membership', label: 'Digital Membership' },
  ];

  const defaultEventState: EventForm = {
    img: null,
    imgPreview: null,
    imgChanged: false,
    eventName: '',
    description: '',
    onlineLink: '',
    date: '',
    startTime: '',
    endTime: '',
    region: [],
    state: [],
    community: [],
    eventOverview: '',
    subtitle: '',
    whyAttend: [''],
    isPaid: false,
    amount: '',
    membershipType: [],
  };

  const [newEvent, setNewEvent] = useState<EventForm>(defaultEventState);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (newEvent.state.length > 0) {
      const cities = newEvent.state
        .map((state) =>
          City.getCitiesOfState(
            'IN',
            State.getStatesOfCountry('IN').find((s) => s.name === state.value)?.isoCode || ''
          ).map((city) => ({
            value: city.name,
            label: city.name,
          }))
        )
        .flat();
      setCityOptions([...new Map(cities.map((item) => [item.value, item])).values()]);
    } else {
      setCityOptions([]);
      setNewEvent((prev) => ({ ...prev, region: [] }));
    }
  }, [newEvent.state]);

  useEffect(() => {
    fetchEvents();
    fetchCommunities();
  }, [selectedState, selectedCommunity]);

  const fetchEvents = async () => {
    try {
      setIsFetching(true);
      const response = await api.get<ApiResponse<Event[]>>('/events/event', {
        params: {
          community: selectedCommunity.length > 0 ? selectedCommunity : undefined,
          state: selectedState.length > 0 ? selectedState : undefined,
          eventType: 'onlineevent',
        },
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        const formattedEvents = response.data.data.map((event) => ({
          ...event,
          date: formatDateForInput(event.date),
        }));
        setEvents(formattedEvents);
      } else {
        toast.error(response.data.message || 'Failed to fetch online events');
      }
    } catch (error) {
      console.error('Error fetching online events:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message || 'Failed to load online events'
      );
    } finally {
      setIsFetching(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      const response = await api.get<ApiResponse<Community[]>>('/community/');
      if (response.data.success && Array.isArray(response.data.data)) {
        setCommunities(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch communities');
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message || 'Failed to load communities'
      );
    }
  };

  const getCommunityNameById = (id: string): string => {
    const community = communities.find((c) => c._id === id);
    return community ? community.communityName : 'Unknown Community';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      toast.error('Image size exceeds 2MB. Please upload a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setNewEvent((prev) => ({
      ...prev,
      img: file,
      imgPreview: previewUrl,
      imgChanged: true,
    }));
    setErrors((prev) => ({ ...prev, img: '' }));
  }
};


  const validateForm = (): boolean => {
    const newErrors: Errors = {};
    const requiredFields: (keyof EventForm)[] = [
      'eventName',
      'date',
      'startTime',
      'onlineLink',
      'description',
      'community',
    ];

    requiredFields.forEach((field) => {
      const value = newEvent[field];
      if (
        !value ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    if (!editingEvent && !newEvent.img && !newEvent.imgPreview) {
      newErrors.img = 'Event image is required';
    } else if (editingEvent && newEvent.imgChanged && !newEvent.img) {
      newErrors.img = 'Please select a new image';
    }

    if (
      newEvent.whyAttend.length === 0 ||
      newEvent.whyAttend.every((reason) => reason.trim() === '')
    ) {
      newErrors.whyAttend = 'At least one reason to attend is required';
    }

    if (
      newEvent.isPaid &&
      (!newEvent.amount || isNaN(Number(newEvent.amount)) || Number(newEvent.amount) <= 0)
    ) {
      newErrors.amount = 'Valid amount is required for paid events';
    }

    const eventDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const currentDate = new Date();
    if (eventDateTime.toString() === 'Invalid Date') {
      newErrors.date = 'Invalid date format';
    } else if (eventDateTime <= currentDate) {
      newErrors.date = 'Event date must be in the future';
    }

    if (newEvent.endTime) {
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);
      if (endDateTime.toString() === 'Invalid Date') {
        newErrors.endTime = 'Invalid end time format';
      } else if (endDateTime <= startDateTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendNotification = async (eventId: string) => {
    try {
      const notificationPayload = {
        Id: [eventId],
        messageTitle: `New Online Event: ${newEvent.eventName}`,
        messageBody: newEvent.subtitle || 'Join our upcoming online event!',
        type: 'event',
      };
      await api.post<NotificationResponse>(
        `${NOTIFICATION_API_URL}/notifications/send-notification`,
        notificationPayload
      );
      toast.success('Notifications sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          'Failed to send notifications'
      );
    }
  };

  const handleManualPayment = async (eventId: string, amount: string) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setIsPaymentLoading(true);
      const response = await api.post<ApiResponse<unknown>>('/payments/manual', {
        onlineEventId: eventId,
        amount,
      });
      if (response.data.success) {
        toast.success('Manual payment recorded successfully!');
        fetchEvents();
        setManualPaymentAmount('');
        navigate('/events');
      } else {
        toast.error(response.data.message || 'Failed to record manual payment');
      }
    } catch (error) {
      console.error('Error recording manual payment:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          'Failed to record manual payment'
      );
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return toast.error('Please fill out all required fields correctly.');
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('eventName', newEvent.eventName);
      formData.append('date', newEvent.date);
      formData.append('startTime', newEvent.startTime);
      if (newEvent.endTime) formData.append('endTime', newEvent.endTime);
      formData.append('onlineLink', newEvent.onlineLink);
      formData.append('description', newEvent.description);
      formData.append('eventType', 'onlineevent');
      formData.append('communities', JSON.stringify(newEvent.community.map((c) => c.value)));
      formData.append('region', JSON.stringify(newEvent.region.map((r) => r.value)));
      formData.append('state', JSON.stringify(newEvent.state.map((s) => s.value)));
      formData.append('eventOverview', newEvent.eventOverview);
      formData.append('subtitle', newEvent.subtitle);
      newEvent.whyAttend
        .filter((reason) => reason.trim() !== '')
        .forEach((reason, index) => {
          formData.append(`whyAttend[${index}]`, reason);
        });
      formData.append('isPaid', String(newEvent.isPaid));
      formData.append('membershipType', JSON.stringify(newEvent.membershipType.map((m) => m.value)));
      if (newEvent.isPaid) {
        formData.append('amount', newEvent.amount);
      }
      if (newEvent.imgChanged && newEvent.img instanceof File) {
        formData.append('img', newEvent.img);
      }

      let response;
      if (editingEvent) {
        response = await api.put<ApiResponse<unknown>>(
          `/events/event/edit/${editingEvent._id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        toast.success('Event updated successfully!');
      } else {
        response = await api.post<ApiResponse<{ _id: string }>>(
          '/events/event/create',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        toast.success('Event created successfully!');
        if (response.data.data?._id) {
          await sendNotification(response.data.data._id);
        } else {
          toast.warn('Event created, but notification not sent due to missing event ID.');
        }
      }

      if (response.data.success) {
        fetchEvents();
      } else {
        toast.error(response.data.message || 'Something went wrong.');
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error during form submission:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      setIsLoading(true);
      const response = await api.delete<ApiResponse<unknown>>(`/events/event/delete/${eventId}`);
      if (response.data.success) {
        toast.success('Event deleted successfully!');
        fetchEvents();
      } else {
        toast.error(response.data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message || 'Failed to delete event'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewEvent(defaultEventState);
    setEditingEvent(null);
    setErrors({});
    setIsDateDisabled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (newEvent.imgPreview && newEvent.imgChanged) {
      URL.revokeObjectURL(newEvent.imgPreview);
    }
  };

const convertTo24HourFormat = (timeStr: string): string => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');

  // Parse hours as a number
  let hoursNum = parseInt(hours, 10);

  // Adjust for PM
  if (modifier === 'PM' && hoursNum !== 12) {
    hoursNum += 12;
  } else if (modifier === 'AM' && hoursNum === 12) {
    hoursNum = 0;
  }

  // Convert back to string with leading zero
  return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
};

const handleEdit = (event: Event) => {
 

  console.log('Event data:', event);

  const imageUrl = event.img ? `${SERVER_URL}/image/${event.img}` : null;
  console.log('Image URL:', imageUrl);

  setEditingEvent(event);

  const startTime24 = event.startTime ? convertTo24HourFormat(event.startTime) : '';
  const endTime24 = event.endTime ? convertTo24HourFormat(event.endTime) : '';

  setNewEvent({
    img: null,
    imgPreview: imageUrl,
    imgChanged: false,
    eventName: event.eventName || '',
    date: event.date ? formatDateForInput(event.date) : '',
    startTime: startTime24,
    endTime: endTime24,
    onlineLink: event.onlineLink || '',
    description: event.description || '',
    community: event.communities?.map((c: { _id: string; name: string }) => ({
      value: c._id,
      label: getCommunityNameById(c._id),
    })) || [],
    region: event.region?.map((r: string) => ({ value: r, label: r })) || [],
    state: event.state?.map((s: string) => ({ value: s, label: s })) || [],
    eventOverview: event.eventOverview || '',
    subtitle: event.subtitle || '',
    whyAttend: event.whyAttend?.length > 0 ? event.whyAttend : [''],
    isPaid: event.isPaid || false,
    amount: event.amount ? String(event.amount) : '',
    membershipType: Array.isArray(event.membershipType)
      ? event.membershipType.map((m: string) => ({ value: m, label: m }))
      : event.membershipType
      ? [{ value: event.membershipType, label: event.membershipType }]
      : [],
  });

  const eventDateTime = new Date(`${event.date}T${event.startTime}`);
  setIsDateDisabled(eventDateTime <= new Date());
  setShowForm(true);
};






  const handleView = async (event: Event) => {
    if (!event || !event._id || !/^[0-9a-fA-F]{24}$/.test(event._id)) {
      console.error('Invalid event or event._id:', event);
      toast.error('Invalid event data');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get<ApiResponse<Event>>(`/events/event/${event._id}`);
      if (response.data.success && response.data.data) {
        setSelectedEvent({
          ...response.data.data,
          date: formatDateForInput(response.data.data.date),
        });
        setManualPaymentAmount(response.data.data.amount || '');
        setShowViewModal(true);
        setSidebarAndHeaderVisibility(false);
      } else {
        toast.error(response.data.message || 'Failed to fetch event details');
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          'Failed to load event details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedEvent(null);
    setManualPaymentAmount('');
    setSidebarAndHeaderVisibility(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (formRef.current && !formRef.current.contains(e.target as Node)) {
      setShowForm(false);
    }
    if (showViewModal && !formRef.current?.contains(e.target as Node)) {
      closeViewModal();
    }
  };

  useEffect(() => {
    setSidebarAndHeaderVisibility(!showForm && !showViewModal);
  }, [showForm, showViewModal, setSidebarAndHeaderVisibility]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (newEvent.imgPreview && newEvent.imgChanged) {
        URL.revokeObjectURL(newEvent.imgPreview);
      }
    };
  }, [newEvent.imgPreview, newEvent.imgChanged]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg font-medium text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 p-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Select
              isMulti
              options={stateOptions}
              value={stateOptions.filter((option) => selectedState.includes(option.value))}
              onChange={(selected: MultiValue<Option>) =>
                setSelectedState(selected.map((s) => s.value))
              }
              placeholder="Filter by State"
              className="w-full"
              styles={customSelectStyles}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              isMulti
              options={communities.map((c) => ({ value: c._id, label: c.communityName }))}
              value={communities
                .filter((c) => selectedCommunity.includes(c._id))
                .map((c) => ({ value: c._id, label: c.communityName }))}
              onChange={(selected: MultiValue<Option>) =>
                setSelectedCommunity(selected.map((s) => s.value))
              }
              placeholder="Filter by Community"
              className="w-full"
              styles={customSelectStyles}
            />
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="mt-4 sm:mt-0 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          disabled={isLoading}
        >
          <PlusCircle className="mr-2" size={22} /> Add Event
        </button>
      </div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {events.length > 0 ? (
    events.map((event) => {
      console.log('Event Card Data:', event);
      const imageUrl = event.img ? `${SERVER_URL}/image/${event.img}` : null;
      console.log('Event Card Image URL:', imageUrl);

      return (
        <div
          key={event._id}
          className="p-6 bg-white shadow-md rounded-lg flex flex-col h-full transition-transform hover:scale-105"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.eventName}
              className="w-full h-48 object-cover rounded-md mb-4"
              onError={(e) => {
                console.warn(`Failed to load image for event ${event._id}: ${imageUrl}`);
                (e.target as HTMLImageElement).src = '/placeholder.jpg';
              }}
            />
          ) : (
            <img
              src="/placeholder.jpg"
              alt="No image"
              className="w-full h-48 object-cover rounded-md mb-4"
            />
          )}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.eventName}</h3>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Subtitle:</span> {event.subtitle}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Date:</span> {formatDateForDisplay(event.date)}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Time:</span> {event.startTime}{' '}
            {event.endTime && ` - ${event.endTime}`}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Link:</span> {event.onlineLink}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Price:</span>{' '}
            {event.isPaid && event.amount ? <>₹{event.amount}</> : 'Free'}
          </p>
          <div className="flex justify-between gap-2 mt-auto">
            <button
              onClick={() => handleEdit(event)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors duration-200"
              disabled={isLoading}
            >
              <Edit2 className="inline mr-2" size={16} /> Edit
            </button>
            <button
              onClick={() => handleDelete(event._id)}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors duration-200"
              disabled={isLoading}
            >
              <Trash2 className="inline mr-2" size={16} /> Delete
            </button>
            <button
              onClick={() => handleView(event)}
              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors duration-200"
              disabled={isLoading}
            >
              View More
            </button>
          </div>
        </div>
      );
    })
  ) : (
    <div className="col-span-full text-center text-gray-500 py-12">
      No events found. Click "Add Event" to create one.
    </div>
  )}
</div>



      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div
            ref={formRef}
            className="bg-white p-8 rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                  <input
                    type="text"
                    name="eventName"
                    value={newEvent.eventName}
                    onChange={handleChange}
                    placeholder="Event Name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <input
                    type="text"
                    name="subtitle"
                    value={newEvent.subtitle}
                    onChange={handleChange}
                    placeholder="Subtitle"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.subtitle && <p className="text-red-500 text-sm mt-1">{errors.subtitle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <input
                    type="date"
                    name="date"
                    value={newEvent.date}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingEvent && isDateDisabled}
                  />
                  {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                </div>
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
  <input
    type="time"
    name="startTime"
    value={newEvent.startTime}
    onChange={handleChange}
    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    disabled={!!editingEvent && isDateDisabled}
  />
  {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
  <input
    type="time"
    name="endTime"
    value={newEvent.endTime}
    onChange={handleChange}
    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    disabled={!!editingEvent && isDateDisabled}
  />
  {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Link</label>
                  <input
                    type="url"
                    name="onlineLink"
                    value={newEvent.onlineLink}
                    onChange={handleChange}
                    placeholder="Event Link (Zoom, Google Meet, etc.)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.onlineLink && <p className="text-red-500 text-sm mt-1">{errors.onlineLink}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
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
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region (City)</label>
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
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Community</label>
                  <Select
                    isMulti
                    options={[{ value: 'ALL', label: 'All Communities' }, ...communities.map((c) => ({ value: c._id, label: c.communityName }))]}
                    value={newEvent.community}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({ ...prev, community: selected }))
                    }
                    placeholder="Select Communities"
                    className="w-full"
                    styles={customSelectStyles}
                  />
                  {errors.community && <p className="text-red-500 text-sm mt-1">{errors.community}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Membership Type</label>
                  <Select
                    isMulti
                    options={membershipOptions}
                    value={newEvent.membershipType}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewEvent((prev) => ({ ...prev, membershipType: selected }))
                    }
                    placeholder="Select Membership Types"
                    className="w-full"
                    styles={customSelectStyles}
                  />
                  {errors.membershipType && (
                    <p className="text-red-500 text-sm mt-1">{errors.membershipType}</p>
                  )}
                </div>
                <div className="col-span-2">
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
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={newEvent.amount}
                      onChange={handleChange}
                      placeholder="Enter Amount (₹)"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>
                )}
              <div className="col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
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
    {editingEvent ? 'Upload a new image or keep the existing one' : 'Select an image (max 2MB)'}
  </p>
  {errors.img && <p className="text-red-500 text-sm mt-1">{errors.img}</p>}
</div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleChange}
                    placeholder="Description"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Overview</label>
                  <textarea
                    name="eventOverview"
                    value={newEvent.eventOverview}
                    onChange={handleChange}
                    placeholder="Event Overview"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  {errors.eventOverview && <p className="text-red-500 text-sm mt-1">{errors.eventOverview}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Why Attend</label>
                  {newEvent.whyAttend.map((reason, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => {
                          const newWhyAttend = [...newEvent.whyAttend];
                          newWhyAttend[index] = e.target.value;
                          setNewEvent((prev) => ({ ...prev, whyAttend: newWhyAttend }));
                        }}
                        placeholder={`Reason ${index + 1}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2"
                      />
                      {newEvent.whyAttend.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newWhyAttend = newEvent.whyAttend.filter((_, i) => i !== index);
                            setNewEvent((prev) => ({ ...prev, whyAttend: newWhyAttend }));
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
                      setNewEvent((prev) => ({ ...prev, whyAttend: [...prev.whyAttend, ''] }))
                    }
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Add Reason
                  </button>
                  {errors.whyAttend && <p className="text-red-500 text-sm mt-1">{errors.whyAttend}</p>}
                </div>
              </div>
              <div className="w-full bg-white p-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : editingEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedEvent && (
        <Modal
          isOpen={showViewModal}
          onRequestClose={closeViewModal}
          className="bg-white p-8 rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{selectedEvent.eventName}</h2>
            <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4 text-gray-700">
            {selectedEvent.img && (
              <img
                src={selectedEvent.img.startsWith('http') ? selectedEvent.img : `${SERVER_URL}/image/${selectedEvent.img}`}
                alt={selectedEvent.eventName}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => {
                  console.warn(
                    `Failed to load image for event ${selectedEvent._id}: ${selectedEvent.img}`
                  );
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />
            )}
            <p>
              <strong className="font-medium">Subtitle:</strong> {selectedEvent.subtitle}
            </p>
            <p>
              <strong className="font-medium">Date:</strong> {formatDateForDisplay(selectedEvent.date)}
            </p>
            <p>
              <strong className="font-medium">Time:</strong> {selectedEvent.startTime}{' '}
              {selectedEvent.endTime && `- ${selectedEvent.endTime}`}
            </p>
            <p>
              <strong className="font-medium">Link:</strong> {selectedEvent.onlineLink}
            </p>
            <p>
              <strong className="font-medium">Description:</strong> {selectedEvent.description}
            </p>
            <p>
              <strong className="font-medium">Event Overview:</strong> {selectedEvent.eventOverview}
            </p>
            <p>
              <strong className="font-medium">Why Attend:</strong>
            </p>
            <ul className="list-disc pl-5">
              {selectedEvent.whyAttend.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
            <p>
              <strong className="font-medium">Price:</strong>{' '}
              {selectedEvent.isPaid && selectedEvent.amount ? `₹${selectedEvent.amount}` : 'Free'}
            </p>
            <p>
              <strong className="font-medium">Membership Type:</strong>{' '}
              {Array.isArray(selectedEvent.membershipType)
                ? selectedEvent.membershipType.join(', ')
                : selectedEvent.membershipType || 'None'}
            </p>
            <p>
              <strong className="font-medium">Communities:</strong>{' '}
              {selectedEvent.communities.map((c) => c.name).join(', ')}
            </p>
            <p>
              <strong className="font-medium">State:</strong> {selectedEvent.state.join(', ')}
            </p>
            <p>
              <strong className="font-medium">Region:</strong> {selectedEvent.region.join(', ')}
            </p>
            <p>
              <strong className="font-medium">Total Participants:</strong>{' '}
              {selectedEvent.totalParticipants || 0}
            </p>
            <p>
              <strong className="font-medium">Participants:</strong>
            </p>
            {selectedEvent.participants?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Name</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Mobile</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Payment Status</th>
                      <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedEvent.participants.map(({ _id, fname, lname, email, mobile, paymentStatus, amountPaid }) => (
                      <tr key={_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{fname} {lname || ''}</td>
                        <td className="py-3 px-4 text-sm">{email}</td>
                        <td className="py-3 px-4 text-sm">{mobile || 'Not provided'}</td>
                        <td className="py-3 px-4 text-sm">{paymentStatus || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{amountPaid ? `₹${amountPaid}` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No participants yet</p>
            )}
            {selectedEvent.isPaid && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Manual Payment
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={manualPaymentAmount}
                    onChange={(e) => setManualPaymentAmount(e.target.value)}
                    placeholder="Enter Payment Amount (₹)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isPaymentLoading}
                  />
                  <button
                    onClick={() => handleManualPayment(selectedEvent._id, manualPaymentAmount)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-green-300"
                    disabled={isPaymentLoading}
                  >
                    {isPaymentLoading ? 'Processing...' : 'Record Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={closeViewModal}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OnlineEvents;
