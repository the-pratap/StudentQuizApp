import { Platform } from 'react-native';

/**
 * PRODUCTION DOMAIN CONFIGURATION:
 * 
 * Live backend domain on cPanel: https://quiz.we99.in/api
 */
export const PRODUCTION_API_URL = 'https://quiz.we99.in/api';

// Auto-detect local development backend IP for Android Emulator vs Web vs Real Device
const getDevApiBaseUrl = () => {
  if (PRODUCTION_API_URL) {
    return PRODUCTION_API_URL;
  }

  // Web browser or Node
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Android Emulator default loopback (10.0.2.2 connects to host computer localhost)
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  // iOS Simulator default loopback
  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getDevApiBaseUrl(),
  TIMEOUT: 15000,
};
