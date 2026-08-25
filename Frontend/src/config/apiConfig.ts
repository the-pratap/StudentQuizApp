import { Platform } from 'react-native';

/**
 * PRODUCTION DOMAIN CONFIGURATION:
 * 
 * If you have a live backend domain (e.g. "https://api.yourdomain.com" or "https://your-app.onrender.com"),
 * set PRODUCTION_API_URL below.
 * 
 * Leave it empty ('') if you want automatic local development detection (localhost / 10.0.2.2 for Android).
 */
export const PRODUCTION_API_URL = ''; // <-- PUT YOUR LIVE DOMAIN URL HERE (e.g. 'https://api.yourdomain.com/api')

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
    return 'http://quiz.we99.in/api';
  }
  // iOS Simulator default loopback
  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getDevApiBaseUrl(),
  TIMEOUT: 15000,
};
