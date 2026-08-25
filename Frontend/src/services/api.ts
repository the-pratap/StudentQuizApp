import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/apiConfig';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('[API Request Interceptor Error]:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract standard error messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let customMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.response) {
      const data = error.response.data;
      customMessage = data.message || customMessage;
      errorCode = data.error || `HTTP_${error.response.status}`;

      // Handle 401 token expiry / session loss
      if (error.response.status === 401) {
        // Can optionally trigger auth logout event
      }
    } else if (error.request) {
      customMessage = 'Unable to connect to the exam server. Please check your network connection.';
      errorCode = 'NETWORK_ERROR';
    }

    const enhancedError = new Error(customMessage);
    (enhancedError as any).code = errorCode;
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default api;
