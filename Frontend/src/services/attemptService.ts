import api from './api';
import { Attempt, Question } from '../types';

export interface StartExamResponse {
  attemptId: string;
  startedAt: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
  serverTime: string;
}

export interface SubmitExamResponse {
  attemptId: string;
  submissionType: 'manual' | 'timeout';
  submittedAt: string;
  resultReleased: boolean;
  message: string;
}

export const attemptService = {
  async startExam(examId: string, otp: string): Promise<StartExamResponse> {
    const res = await api.post(`/exams/${examId}/start`, { otp });
    return res.data.data;
  },

  async submitExam(
    attemptId: string,
    answers: { questionId: string; selectedOption: string }[],
    isTimeout: boolean = false
  ): Promise<SubmitExamResponse> {
    const res = await api.post(`/attempts/${attemptId}/submit`, {
      answers,
      isTimeout,
    });
    return res.data.data;
  },

  async getAttemptDetails(attemptId: string): Promise<Attempt> {
    const res = await api.get(`/attempts/${attemptId}`);
    return res.data.data;
  },
};
