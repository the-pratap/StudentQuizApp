import api from './api';

export const otpService = {
  async generateOTP(examId: string, validityHours: number = 24): Promise<{ otp: string; expiresAt: string }> {
    const res = await api.post(`/exams/${examId}/otp/generate`, { validityHours });
    return res.data.data;
  },

  async getCurrentOTP(examId: string): Promise<{ otp: string; expiresAt: string; isExpired: boolean }> {
    const res = await api.get(`/exams/${examId}/otp/current`);
    return res.data.data;
  },

  async verifyOTP(examId: string, otp: string): Promise<boolean> {
    const res = await api.post(`/exams/${examId}/otp/verify`, { otp });
    return res.data.success;
  },
};
