import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true',
});

// Interceptors
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No JWT token found in localStorage');
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data instanceof FormData ? Object.fromEntries(config.data) : config.data,
    });
    return config;
  },
  (error) => {
    console.error('API Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

const collectionApi = {
  // Fetch all collections
  fetchAllCollections: async () => {
    try {
      const response = await api.get('/collections');
      console.log('fetchAllCollections Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchAllCollections Error:', error);
      throw error;
    }
  },

  // Fetch saved collections
  fetchSavedCollections: async () => {
    try {
      const response = await api.get('/collections/saved');
      console.log('fetchSavedCollections Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchSavedCollections Error:', error);
      throw error;
    }
  },

  // Upload media
  uploadMedia: async (formData: FormData, config?: any) => {
    try {
      const response = await api.post('/upload-media', formData, {
        ...config,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('uploadMedia Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('uploadMedia Error:', error);
      throw error;
    }
  },

  // Delete media
  deleteMedia: async (mediaId: string) => {
    try {
      const response = await api.delete(`/media/${mediaId}`);
      console.log('deleteMedia Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('deleteMedia Error:', error);
      throw error;
    }
  },


  // In collectionApi (knowldgehub.ts)
updateMedia: async (mediaId: string, formData: FormData) => {
  try {
    const response = await api.patch(`/media/${mediaId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    console.log('updateMedia Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('updateMedia Error:', error);
    throw error;
  }
},
  // Delete collection
deleteCollection: async (collectionId: string) => {
  try {
    const response = await api.delete(`/collections/${collectionId}`);
    console.log('deleteCollection Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('deleteCollection Error:', error);
    throw error;
  }
},


toggleSaveCollection: async (collectionId: string) => {
  try {
    const response = await api.post('/collections/save', { collectionId });
    console.log('toggleSaveCollection Response:', response.data);
    // ✅ return the whole object so caller can show toast
    return response.data;
  } catch (error) {
    console.error('toggleSaveCollection Error:', error);
    throw error;
  }
},

  // Update collection
  updateCollection: async (collectionId: string, formData: FormData) => {
    try {
      const response = await api.patch(`/collections/${collectionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('updateCollection Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('updateCollection Error:', error);
      throw error;
    }
  },

  // Get collections by type and subtype
  getCollectionsByTypeAndSubtype: async (query: { type?: string; expertType?: string }) => {
    try {
      const response = await api.get('/collections', { params: query });
      console.log('getCollectionsByTypeAndSubtype Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('getCollectionsByTypeAndSubtype Error:', error);
      throw error;
    }
  },
};

export default collectionApi;