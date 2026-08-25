export type UserRole = 'student' | 'admin';
export type UserStatus = 'active' | 'blocked';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type ExamStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  examDate: string;
  startTime: string;
  startDateTime: string;
  durationMinutes: number;
  totalQuestions: number;
  status: ExamStatus;
  resultReleased: boolean;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  activeOtp?: string; // only returned for Admin
  studentAttempt?: {
    status: 'started' | 'submitted' | 'evaluated';
    submittedAt?: string;
    score?: number;
    percentage?: number;
  } | null;
  createdAt: string;
}

export interface Question {
  id: string;
  examId?: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer?: string; // only visible to Admin
  marks: number;
  explanation?: string;
}

export interface AnswerPayload {
  questionId: string;
  selectedOption: string; // "A" | "B" | "C" | "D"
}

export interface AttemptAnswerDetail {
  questionNumber: number;
  questionText: string;
  options: string[];
  selectedOption: string | null;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
  marksObtained: number;
}

export interface Attempt {
  attemptId: string;
  exam: {
    id: string;
    title: string;
    subject: string;
    examDate: string;
    startTime: string;
    durationMinutes?: number;
    totalQuestions?: number;
    resultReleased: boolean;
  };
  status: 'started' | 'submitted' | 'evaluated';
  startedAt: string;
  submittedAt?: string;
  durationSpentSeconds?: number;
  submissionType?: 'manual' | 'timeout';
  score?: number;
  totalMarks?: number;
  percentage?: number;
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  breakdown?: AttemptAnswerDetail[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  durationSpentSeconds: number;
  submittedAt: string;
  isCurrentUser: boolean;
}

export interface AdminMetrics {
  totalStudents: number;
  blockedStudents: number;
  totalExams: number;
  upcomingExams: number;
  activeExams: number;
  completedExams: number;
  totalAttempts: number;
  resultsPending: number;
  totalQuestions: number;
}

export interface StudentListItem {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  registeredDate: string;
  totalAttempts: number;
}
