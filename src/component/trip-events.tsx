import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';
import { useVisibility } from '../context/VisibilityContext';
import api from '../api/api';
import { City, State } from 'country-state-city';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { AxiosError } from 'axios';

Modal.setAppElement('#root');

const SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const NOTIFICATION_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

interface Option {
  value: string;
  label: string;
}

interface Community {
  _id: string;
  communityName: string;
}

interface Trip {
  _id: string;
  img?: string;
  eventName: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
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
    tableNo?: number | null;
    attendance?: boolean;
  }>;
  eventType: string;
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

interface TripForm {
  img: File | null;
  imgPreview: string | null;
  imgChanged: boolean;
  eventName: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
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
  imgPreview?: string;
  imgChanged?: string;
  eventName?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  region?: string;
  state?: string;
  community?: string;
  eventOverview?: string;
  whyAttend?: string;
  amount?: string;
  membershipType?: string;
  description?: string;
  isPaid?: string; // Added to fix TS7053
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

const AdminTrips: React.FC = () => {
  const { setSidebarAndHeaderVisibility } = useVisibility();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string[]>([]);
  const [manualPaymentAmount, setManualPaymentAmount] = useState<string>('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isDateDisabled, setIsDateDisabled] = useState<boolean>(false); // Explicitly typed as boolean
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

  const defaultTripState: TripForm = {
    img: null,
    imgPreview: null,
    imgChanged: false,
    eventName: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
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

  const [newTrip, setNewTrip] = useState<TripForm>(defaultTripState);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (newTrip.state.length > 0) {
      const cities = newTrip.state
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
      setNewTrip((prev) => ({ ...prev, region: [] }));
    }
  }, [newTrip.state]);

  useEffect(() => {
    fetchTrips();
    fetchCommunities();
  }, [selectedRegion, selectedCommunity]);

  const fetchTrips = async () => {
    try {
      setIsFetching(true);
      const response = await api.get<ApiResponse<Trip[]>>('/events/event', {
        params: {
          community: selectedCommunity.length > 0 ? selectedCommunity : undefined,
          state: selectedRegion.length > 0 ? selectedRegion : undefined,
          eventType: 'tripevent',
        },
      });
      console.log('Fetched trips:', response.data.data); // Debug log
      if (response.data.success && Array.isArray(response.data.data)) {
        setTrips(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message || 'Failed to load trips'
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

  const handleDelete = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      setIsLoading(true);
      const response = await api.delete<ApiResponse<unknown>>(`/events/event/delete/${tripId}`);
      if (response.data.success) {
        toast.success('Trip deleted successfully!');
        fetchTrips();
      } else {
        toast.error(response.data.message || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message || 'Failed to delete trip'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCommunityNameById = (id: string): string => {
    const community = communities.find((c) => c._id === id);
    return community ? community.communityName : 'Unknown Community';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setNewTrip((prev) => ({
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
      setNewTrip((prev) => ({
        ...prev,
        img: file,
        imgPreview: previewUrl,
        imgChanged: true,
      }));
      setErrors((prev) => ({ ...prev, img: '', imgPreview: '', imgChanged: '' }));
    }
  };

 const validateForm = (): boolean => {
  const newErrors: Errors = {};
  const requiredFields: (keyof TripForm)[] = [
    'eventName',
    'startDate',
    'endDate',
    'startTime',
    'location',
    'description',
    'community',
    'subtitle',
    'eventOverview',
  ];

  requiredFields.forEach((field) => {
    const value = newTrip[field];
    if (
      !value ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    ) {
      newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  // Only require img for new trips or if imgChanged is true
  if (!editingTrip && !newTrip.img && !newTrip.imgPreview) {
    newErrors.img = 'Event image is required';
  } else if (editingTrip && newTrip.imgChanged && !newTrip.img) {
    newErrors.img = 'Please select a new image';
  }

  if (
    newTrip.whyAttend.length === 0 ||
    newTrip.whyAttend.every((reason) => reason.trim() === '')
  ) {
    newErrors.whyAttend = 'At least one reason to attend is required';
  }

  if (
    newTrip.isPaid &&
    (!newTrip.amount || isNaN(Number(newTrip.amount)) || Number(newTrip.amount) <= 0)
  ) {
    newErrors.amount = 'Valid amount is required for paid trips';
  }

  // Validate dates
  const currentDate = new Date(); // Use current date
  const startDateTime = new Date(`${newTrip.startDate}T${newTrip.startTime}`);
  if (isNaN(startDateTime.getTime()) || startDateTime <= currentDate) {
    newErrors.startDate = 'Start date and time must be in the future';
  }

  if (newTrip.startDate && newTrip.endDate) {
    const startDate = new Date(newTrip.startDate);
    const endDate = new Date(newTrip.endDate);
    if (endDate < startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
  }

  if (newTrip.endTime) {
    const startDateTime = new Date(`${newTrip.startDate}T${newTrip.startTime}`);
    const endDateTime = new Date(`${newTrip.endDate}T${newTrip.endTime}`);
    if (isNaN(endDateTime.getTime())) {
      newErrors.endTime = 'Invalid end time format';
    } else if (endDateTime <= startDateTime) {
      newErrors.endTime = 'End time must be after start time';
    }
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const sendNotification = async (tripId: string) => {
    try {
      const notificationPayload = {
        Id: [tripId],
        messageTitle: `New Trip: ${newTrip.eventName}`,
        messageBody: newTrip.subtitle || 'You have been invited to a new trip',
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

  const handleManualPayment = async (tripId: string, amount: string) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setIsPaymentLoading(true);
      const response = await api.post<ApiResponse<unknown>>('/payments/manual', {
        eventId: tripId,
        amount,
      });
      if (response.data.success) {
        toast.success('Manual payment recorded successfully!');
        fetchTrips();
        setManualPaymentAmount('');
        navigate('/admin/events');
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
      formData.append('eventName', newTrip.eventName);
      formData.append('startDate', newTrip.startDate);
      formData.append('endDate', newTrip.endDate);
      formData.append('startTime', newTrip.startTime);
      if (newTrip.endTime) formData.append('endTime', newTrip.endTime);
      formData.append('location', newTrip.location);
      formData.append('description', newTrip.description);
      formData.append(
        'communities',
        JSON.stringify(newTrip.community.map((c) => ({ _id: c.value })))
      );
      formData.append('region', JSON.stringify(newTrip.region.map((r) => r.value)));
      formData.append('state', JSON.stringify(newTrip.state.map((s) => s.value)));
      formData.append('eventOverview', newTrip.eventOverview);
      formData.append('subtitle', newTrip.subtitle);
      newTrip.whyAttend
        .filter((reason) => reason.trim() !== '')
        .forEach((reason, index) => {
          formData.append(`whyAttend[${index}]`, reason);
        });
      formData.append('isPaid', String(newTrip.isPaid));
      formData.append('membershipType', JSON.stringify(newTrip.membershipType.map((m) => m.value)));
      formData.append('eventType', 'tripevent');
      if (newTrip.isPaid) {
        formData.append('amount', newTrip.amount);
      }
      if (newTrip.imgChanged && newTrip.img instanceof File) {
        formData.append('img', newTrip.img);
      }

      let response;
      if (editingTrip) {
        response = await api.put<ApiResponse<unknown>>(
          `/events/event/edit/${editingTrip._id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        toast.success('Trip updated successfully!');
      } else {
        response = await api.post<ApiResponse<{ _id: string }>>(
          '/events/event/create',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        toast.success('Trip created successfully!');
        if (response.data.data?._id) {
          await sendNotification(response.data.data._id);
        } else {
          toast.warn('Trip created, but notification not sent due to missing trip ID.');
        }
      }

      if (response.data.success) {
        fetchTrips();
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

  const resetForm = () => {
    setNewTrip(defaultTripState);
    setEditingTrip(null);
    setErrors({});
    setIsDateDisabled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (newTrip.imgPreview && newTrip.imgChanged) {
      URL.revokeObjectURL(newTrip.imgPreview);
    }
  };

const handleEdit = (trip: Trip) => {
  console.log('Editing trip:', trip); // Debug log

  if (trip.eventType !== 'tripevent') {
    toast.error('This form is for Trip Events only');
    return;
  }

  const imageUrl = trip.img ? `${SERVER_URL}/image/${trip.img}` : null;
  console.log('Image URL:', imageUrl); // Debug log

  setEditingTrip(trip);

  // Convert startTime and endTime to 24-hour format
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

  const startTime24 = trip.startTime ? convertTo24HourFormat(trip.startTime) : '';
  const endTime24 = trip.endTime ? convertTo24HourFormat(trip.endTime) : '';

  setNewTrip({
    img: null,
    imgPreview: imageUrl,
    imgChanged: false,
    eventName: trip.eventName || '',
    startDate: trip.startDate ? trip.startDate.split('T')[0] : '',
    endDate: trip.endDate ? trip.endDate.split('T')[0] : '',
    startTime: startTime24,
    endTime: endTime24,
    location: trip.location || '',
    description: trip.description || '',
    community: trip.communities?.map((c) => ({
      value: c._id,
      label: getCommunityNameById(c._id),
    })) || [],
    region: trip.region?.map((r) => ({ value: r, label: r })) || [],
    state: trip.state?.map((s) => ({ value: s, label: s })) || [],
    eventOverview: trip.eventOverview || '',
    subtitle: trip.subtitle || '',
    whyAttend: trip.whyAttend?.length > 0 ? trip.whyAttend : [''],
    isPaid: trip.isPaid || false,
    amount: trip.amount ? String(trip.amount) : '',
    membershipType: Array.isArray(trip.membershipType)
      ? trip.membershipType.map((m) => ({ value: m, label: m }))
      : trip.membershipType
      ? [{ value: trip.membershipType, label: trip.membershipType }]
      : [],
  });

  const eventDateTime = new Date(`${trip.startDate}T${trip.startTime}`);
  setIsDateDisabled(eventDateTime <= new Date());
  setShowForm(true);
};

  const handleView = async (trip: Trip) => {
    if (trip.eventType !== 'tripevent') {
      toast.error('This form is for Trip Events only');
      return;
    }
    if (!trip || !trip._id || !/^[0-9a-fA-F]{24}$/.test(trip._id)) {
      console.error('Invalid trip or trip._id:', trip);
      toast.error('Invalid trip data');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get<ApiResponse<Trip>>(`/events/event/${trip._id}`);
      if (response.data.success && response.data.data && response.data.data.eventType === 'tripevent') {
        setSelectedTrip(response.data.data);
        setManualPaymentAmount(response.data.data.amount ? String(response.data.data.amount) : '');
        setShowViewModal(true);
        setSidebarAndHeaderVisibility(false);
      } else {
        toast.error(response.data.message || 'Failed to fetch trip details');
      }
    } catch (error) {
      console.error('Error fetching trip details:', error);
      toast.error(
        (error as AxiosError<{ message?: string }>).response?.data?.message ||
          'Failed to load trip details'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedTrip(null);
    setManualPaymentAmount('');
    setSidebarAndHeaderVisibility(true);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (formRef.current && !formRef.current.contains(e.target as Node)) {
      setShowForm(false);
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
      if (newTrip.imgPreview && newTrip.imgChanged) {
        URL.revokeObjectURL(newTrip.imgPreview);
      }
    };
  }, [newTrip.imgPreview, newTrip.imgChanged]);

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg font-medium text-gray-600">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-64">
            <Select
              isMulti
              options={stateOptions}
              value={stateOptions.filter((option) => selectedRegion.includes(option.value))}
              onChange={(selected: MultiValue<Option>) =>
                setSelectedRegion(selected.map((s) => s.value))
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
          <PlusCircle className="mr-2" size={22} /> Add Trip
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.length > 0 ? (
          trips.map((trip) => (
            <div
              key={trip._id}
              className="p-6 bg-white shadow-md rounded-lg flex flex-col h-full transition-transform hover:scale-105"
            >
              {trip.img ? (
                <img
                  src={trip.img.startsWith('http') ? trip.img : `${SERVER_URL}/image/${trip.img}`}
                  alt={trip.eventName}
                  className="w-full h-48 object-cover rounded-md mb-4"
                  onError={(e) => {
                    console.warn(`Failed to load image for trip ${trip._id}: ${trip.img}`);
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
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{trip.eventName}</h3>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Subtitle:</span> {trip.subtitle}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Dates:</span>{' '}
                {new Date(trip.startDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                -{' '}
                {new Date(trip.endDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Time:</span> {trip.startTime}{' '}
                {trip.endTime ? `- ${trip.endTime}` : ''}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Location:</span> {trip.location}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Price:</span>{' '}
                {trip.isPaid && trip.amount ? `₹${trip.amount}` : 'Free'}
              </p>
              <div className="flex justify-between gap-2 mt-auto">
                <button
                  onClick={() => handleEdit(trip)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors duration-200"
                  disabled={isLoading}
                >
                  <Edit2 className="inline mr-2" size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(trip._id)}
                  className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors duration-200"
                  disabled={isLoading}
                >
                  <Trash2 className="inline mr-2" size={16} /> Delete
                </button>
                <button
                  onClick={() => handleView(trip)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm transition-colors duration-200"
                  disabled={isLoading}
                >
                  View More
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-12">
            No trip events found. Click "Add Trip" to create one.
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
                {editingTrip ? 'Edit Trip Event' : 'Add Trip Event'}
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
                    value={newTrip.eventName}
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
                    value={newTrip.subtitle}
                    onChange={handleChange}
                    placeholder="Subtitle"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.subtitle && <p className="text-red-500 text-sm mt-1">{errors.subtitle}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newTrip.startDate}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingTrip && isDateDisabled}
                  />
                  {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newTrip.endDate}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingTrip && isDateDisabled}
                  />
                  {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={newTrip.startTime}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingTrip && isDateDisabled}
                  />
                  {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time (Optional)</label>
                  <input
                    type="time"
                    name="endTime"
                    value={newTrip.endTime}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!!editingTrip && isDateDisabled}
                  />
                  {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={newTrip.location}
                    onChange={handleChange}
                    placeholder="Location"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <Select
                    isMulti
                    options={stateOptions}
                    value={newTrip.state}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewTrip((prev) => ({ ...prev, state: selected }))
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
                    value={newTrip.region}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewTrip((prev) => ({ ...prev, region: selected }))
                    }
                    placeholder="Select Regions"
                    className="w-full"
                    styles={customSelectStyles}
                    isDisabled={newTrip.state.length === 0}
                  />
                  {errors.region && <p className="text-red-500 text-sm mt-1">{errors.region}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Community</label>
                  <Select
                    isMulti
                    options={communities.map((c) => ({ value: c._id, label: c.communityName }))}
                    value={newTrip.community}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewTrip((prev) => ({ ...prev, community: selected }))
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
                    value={newTrip.membershipType}
                    onChange={(selected: MultiValue<Option>) =>
                      setNewTrip((prev) => ({ ...prev, membershipType: selected }))
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
                      checked={newTrip.isPaid}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    Is Paid Trip
                  </label>
                </div>
                {newTrip.isPaid && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      name="amount"
                      value={newTrip.amount}
                      onChange={handleChange}
                      placeholder="Enter Amount"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
                  {newTrip.imgPreview && (
                    <div className="mb-3">
                      <img
                        src={newTrip.imgPreview}
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
                    {editingTrip ? 'Upload a new image or keep the existing one' : 'Select an image (max 2MB)'}
                  </p>
                  {errors.img && <p className="text-red-500 text-sm mt-1">{errors.img}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newTrip.description}
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
                    value={newTrip.eventOverview}
                    onChange={handleChange}
                    placeholder="Event Overview"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  {errors.eventOverview && <p className="text-red-500 text-sm mt-1">{errors.eventOverview}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Why Attend</label>
                  {newTrip.whyAttend.map((reason, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => {
                          const newWhyAttend = [...newTrip.whyAttend];
                          newWhyAttend[index] = e.target.value;
                          setNewTrip((prev) => ({ ...prev, whyAttend: newWhyAttend }));
                        }}
                        placeholder={`Reason ${index + 1}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2"
                      />
                      {newTrip.whyAttend.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newWhyAttend = newTrip.whyAttend.filter((_, i) => i !== index);
                            setNewTrip((prev) => ({ ...prev, whyAttend: newWhyAttend }));
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
                      setNewTrip((prev) => ({ ...prev, whyAttend: [...prev.whyAttend, ''] }))
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
                  {isLoading ? 'Processing...' : editingTrip ? 'Update Trip Event' : 'Add Trip Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedTrip && (
        <Modal
          isOpen={showViewModal}
          onRequestClose={closeViewModal}
          className="bg-white p-8 rounded-xl shadow-2xl w-[800px] max-h-[90vh] overflow-y-auto mx-auto my-8"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">{selectedTrip.eventName}</h2>
            <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4 text-gray-700">
            {selectedTrip.img && (
              <img
                src={selectedTrip.img.startsWith('http') ? selectedTrip.img : `${SERVER_URL}/image/${selectedTrip.img}`}
                alt={selectedTrip.eventName}
                className="w-full h-48 object-cover rounded-md mb-4"
                onError={(e) => {
                  console.warn(`Failed to load image for trip ${selectedTrip._id}: ${selectedTrip.img}`);
                  (e.target as HTMLImageElement).src = '/placeholder.jpg';
                }}
              />
            )}
            <p>
              <strong className="font-medium">Subtitle:</strong> {selectedTrip.subtitle || 'None'}
            </p>
            <p>
              <strong className="font-medium">Start Date:</strong>{' '}
              {new Date(selectedTrip.startDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <strong className="font-medium">End Date:</strong>{' '}
              {new Date(selectedTrip.endDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <strong className="font-medium">Time:</strong> {selectedTrip.startTime}{' '}
              {selectedTrip.endTime ? `- ${selectedTrip.endTime}` : ''}
            </p>
            <p>
              <strong className="font-medium">Location:</strong> {selectedTrip.location}
            </p>
            <p>
              <strong className="font-medium">Description:</strong> {selectedTrip.description}
            </p>
            <p>
              <strong className="font-medium">Event Overview:</strong> {selectedTrip.eventOverview || 'None'}
            </p>
            <p>
              <strong className="font-medium">Why Attend:</strong>
            </p>
            <ul className="list-disc pl-5">
              {selectedTrip.whyAttend.length > 0 ? (
                selectedTrip.whyAttend.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))
              ) : (
                <li>None provided</li>
              )}
            </ul>
            <p>
              <strong className="font-medium">Price:</strong>{' '}
              {selectedTrip.isPaid && selectedTrip.amount ? `₹${selectedTrip.amount}` : 'Free'}
            </p>
            <p>
              <strong className="font-medium">Membership Type:</strong>{' '}
              {Array.isArray(selectedTrip.membershipType) && selectedTrip.membershipType.length > 0
                ? selectedTrip.membershipType.join(', ')
                : 'None'}
            </p>
            <p>
              <strong className="font-medium">Communities:</strong>{' '}
              {selectedTrip.communities.map((c) => c.name).join(', ') || 'None'}
            </p>
            <p>
              <strong className="font-medium">State:</strong> {selectedTrip.state.join(', ') || 'None'}
            </p>
            <p>
              <strong className="font-medium">Region:</strong> {selectedTrip.region.join(', ') || 'None'}
            </p>
            <p>
              <strong className="font-medium">Total Participants:</strong>{' '}
              {selectedTrip.totalParticipants || 0}
            </p>
            <p>
              <strong className="font-medium">Participants:</strong>
            </p>
            {selectedTrip.participants?.length ? (
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
                    {selectedTrip.participants.map(({ _id, fname, lname, email, mobile, paymentStatus, amountPaid }) => (
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
            {selectedTrip.isPaid && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Record Manual Payment
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={manualPaymentAmount}
                    onChange={(e) => setManualPaymentAmount(e.target.value)}
                    placeholder="Enter Payment Amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isPaymentLoading}
                  />
                  <button
                    onClick={() => handleManualPayment(selectedTrip._id, manualPaymentAmount)}
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

export default AdminTrips;