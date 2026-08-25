import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  async register(name: string, email: string, password: string, confirmPassword?: string, role: string = 'student'): Promise<LoginResponse> {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword, role });
    const data = res.data.data;
    if (data.token) {
      await AsyncStorage.setItem('user_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data.data;
    if (data.token) {
      await AsyncStorage.setItem('user_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await api.get('/auth/me');
    const user = res.data.data.user;
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    } finally {
      await AsyncStorage.removeItem('user_token');
      await AsyncStorage.removeItem('user_data');
    }
  },

  async getStoredSession(): Promise<{ token: string | null; user: User | null }> {
    const [token, userData] = await Promise.all([
      AsyncStorage.getItem('user_token'),
      AsyncStorage.getItem('user_data'),
    ]);

    return {
      token,
      user: userData ? JSON.parse(userData) : null,
    };
  },
};
