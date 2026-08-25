import { Platform } from 'react-native';

 
 

// Auto-detect local development backend IP for Android Emulator vs Web vs Real Device
const getDevApiBaseUrl = () => {
 

  // Web browser or Node
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Android Emulator default loopback (10.0.2.2 connects to host computer localhost)
  if (Platform.OS === 'android') {
    return 'http://10.135.130.216:5000/api';
  }
  // iOS Simulator default loopback
  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getDevApiBaseUrl(),
  TIMEOUT: 15000,
};
