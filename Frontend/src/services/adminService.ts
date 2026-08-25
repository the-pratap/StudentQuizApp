import api from './api';
import { AdminMetrics, StudentListItem } from '../types';

export const adminService = {
  async getDashboard(): Promise<{
    metrics: AdminMetrics;
    recentAttempts: any[];
    recentStudents: any[];
  }> {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  async getStudents(): Promise<StudentListItem[]> {
    const res = await api.get('/admin/students');
    return res.data.data;
  },

  async blockStudent(id: string): Promise<void> {
    await api.patch(`/admin/students/${id}/block`);
  },

  async unblockStudent(id: string): Promise<void> {
    await api.patch(`/admin/students/${id}/unblock`);
  },

  async deleteStudent(id: string): Promise<void> {
    await api.delete(`/admin/students/${id}`);
  },

  async getExamAttempts(examId: string): Promise<{
    exam: any;
    totalSubmissions: number;
    data: any[];
  }> {
    const res = await api.get(`/admin/exams/${examId}/attempts`);
    return res.data;
  },

  async releaseResult(examId: string): Promise<any> {
    const res = await api.post(`/admin/exams/${examId}/release-result`);
    return res.data;
  },

  async addQuestion(examId: string, questionData: any): Promise<any> {
    const res = await api.post(`/exams/${examId}/questions`, questionData);
    return res.data.data;
  },

  async bulkAddQuestions(examId: string, questions: any[]): Promise<any> {
    const res = await api.post(`/exams/${examId}/questions/bulk`, { questions });
    return res.data;
  },

  async updateQuestion(questionId: string, questionData: any): Promise<any> {
    const res = await api.put(`/questions/${questionId}`, questionData);
    return res.data.data;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    await api.delete(`/questions/${questionId}`);
  },
};
