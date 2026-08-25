import api from './api';
import { Exam, Question } from '../types';

const normalizeExam = (raw: any): Exam => {
  if (!raw) return raw;
  return {
    ...raw,
    id: raw.id || raw._id,
  };
};

export const examService = {
  async getAllExams(): Promise<{ exams: Exam[]; serverTime: string }> {
    const res = await api.get('/exams');
    const rawList = res.data.data || [];
    return {
      exams: rawList.map(normalizeExam),
      serverTime: res.data.serverTime,
    };
  },

  async getExamById(id: string): Promise<{ exam: Exam; serverTime: string }> {
    const res = await api.get(`/exams/${id}`);
    return {
      exam: normalizeExam(res.data.data),
      serverTime: res.data.serverTime,
    };
  },

  async getExamQuestions(examId: string): Promise<Question[]> {
    const res = await api.get(`/exams/${examId}/questions`);
    const list = res.data.data || [];
    return list.map((q: any) => ({
      ...q,
      id: q.id || q._id,
    }));
  },

  async createExam(examData: {
    title: string;
    description: string;
    subject: string;
    examDate: string;
    startTime: string;
    durationMinutes: number;
    totalQuestions: number;
  }): Promise<{ exam: Exam; otp: string }> {
    const res = await api.post('/exams', examData);
    const data = res.data.data;
    return {
      exam: normalizeExam(data.exam),
      otp: data.otp,
    };
  },

  async updateExam(id: string, examData: Partial<Exam>): Promise<Exam> {
    const res = await api.put(`/exams/${id}`, examData);
    return normalizeExam(res.data.data);
  },

  async deleteExam(id: string): Promise<void> {
    await api.delete(`/exams/${id}`);
  },
};
