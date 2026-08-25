import api from './api';
import { User, LeaderboardEntry } from '../types';

export interface StudentStats {
  totalAttempts: number;
  completedAttempts: number;
  releasedResultsCount: number;
  averagePercentage: number;
  totalScoreObtained: number;
  totalPossibleMarks: number;
}

export const studentService = {
  async getProfile(): Promise<{ user: User; stats: StudentStats }> {
    const res = await api.get('/students/profile');
    return res.data.data;
  },

  async getAttempts(): Promise<any[]> {
    const res = await api.get('/students/attempts');
    return res.data.data;
  },

  async getResults(): Promise<any[]> {
    const res = await api.get('/students/results');
    return res.data.data;
  },

  async getLeaderboard(examId: string): Promise<{
    exam: { id: string; title: string; subject: string; examDate: string; totalQuestions: number; resultReleased: boolean };
    totalParticipants: number;
    data: LeaderboardEntry[];
  }> {
    const res = await api.get(`/students/leaderboard/${examId}`);
    return res.data;
  },
};
