# Full-Stack Student Quiz / Online Examination Mobile Application Walkthrough

A production-grade, secure **Student Quiz & Online Examination System** built with **React Native (Expo + TypeScript + Expo Router)** featuring a modern **Glassmorphism Dark Theme** and a robust **Node.js / Express.js / MongoDB Atlas** backend.

---

## 1. Final Project Architecture & Folder Structure

```text
StudentQuizApp/
├── Backend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── app.js
│   ├── server.js
│   ├── seed.js
│   ├── test-apis.js
│   ├── config/
│   │   └── Database.js
│   ├── middleware/
│   │   ├── authenticateJWT.js
│   │   ├── checkAdmin.js
│   │   ├── checkStudent.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── UserSchema.js
│   │   ├── ExamSchema.js
│   │   ├── QuestionSchema.js
│   │   ├── AttemptSchema.js
│   │   └── OTPSchema.js
│   └── routes/
│       ├── authRoutes.js
│       ├── examRoutes.js
│       ├── questionRoutes.js
│       ├── otpRoutes.js
│       ├── attemptRoutes.js
│       ├── studentRoutes.js
│       └── adminRoutes.js
│
└── Frontend/
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── theme/
        │   ├── colors.ts
        │   └── glass.ts
        ├── types/
        │   └── index.ts
        ├── config/
        │   └── apiConfig.ts
        ├── context/
        │   └── AuthContext.tsx
        ├── services/
        │   ├── api.ts
        │   ├── authService.ts
        │   ├── examService.ts
        │   ├── attemptService.ts
        │   ├── otpService.ts
        │   ├── studentService.ts
        │   └── adminService.ts
        ├── components/
        │   ├── GlassCard.tsx
        │   ├── GlassButton.tsx
        │   ├── GlassInput.tsx
        │   ├── ExamCard.tsx
        │   ├── Timer.tsx
        │   ├── QuestionPalette.tsx
        │   ├── OTPModal.tsx
        │   ├── AdminStatCard.tsx
        │   ├── LoadingState.tsx
        │   ├── EmptyState.tsx
        │   └── ErrorState.tsx
        └── app/
            ├── _layout.tsx
            ├── index.tsx (Splash Screen & Auth Routing)
            ├── (auth)/
            │   ├── _layout.tsx
            │   ├── login.tsx
            │   └── register.tsx
            ├── (student)/
            │   ├── _layout.tsx
            │   ├── (tabs)/
            │   │   ├── _layout.tsx
            │   │   ├── index.tsx (Student Home)
            │   │   ├── exams.tsx (Exams Directory)
            │   │   ├── leaderboard.tsx (Podium & Merit List)
            │   │   └── profile.tsx (Student Profile & Attempt History)
            │   └── exam/
            │       ├── [id].tsx (Exam Details & OTP Verification)
            │       ├── quiz.tsx (50-MCQ Engine with 10-Minute Live Timer)
            │       ├── submitted.tsx (Submission Confirmation & Confidentiality)
            │       └── result.tsx (Released Result Breakdown)
            └── (admin)/
                ├── _layout.tsx
                ├── (tabs)/
                │   ├── _layout.tsx
                │   ├── index.tsx (Admin Dashboard with Live Metrics)
                │   ├── exams.tsx (Exam Management CRUD)
                │   ├── students.tsx (Student Management & Block/Unblock)
                │   ├── results.tsx (Results Evaluation & Release)
                │   └── profile.tsx (Admin Profile & Logout)
                ├── create-exam.tsx (Create 50-MCQ Examination)
                ├── edit-exam/
                │   └── [id].tsx (Edit Exam Schedule)
                ├── manage-questions/
                │   └── [id].tsx (50-MCQ Management & Bulk Auto-Populator)
                ├── manage-otp/
                │   └── [id].tsx (Active OTP Display & Regeneration)
                └── exam-attempts/
                    └── [id].tsx (Student Submissions & Score Logs)
```

---

## 2. Verification & Automated Test Results

All 17 automated tests were executed via `Backend/test-apis.js` with **100% test coverage and 0 failures**:

| # | Test Suite Case | API Route | Result |
|---|----------------|-----------|:------:|
| 1 | Server Health & Ping | `GET /api/health` | **PASSED** |
| 2 | Admin Authentication & JWT | `POST /api/auth/login` | **PASSED** |
| 3 | Student Authentication & JWT | `POST /api/auth/login` | **PASSED** |
| 4 | Duplicate Email Prevention | `POST /api/auth/register` | **PASSED** |
| 5 | Exam Directory & Dynamic Status | `GET /api/exams` | **PASSED** |
| 6 | Question Sanitization (No `correctAnswer` exposed) | `GET /api/exams/:id/questions` | **PASSED** |
| 7 | OTP Verification (Invalid vs Valid) | `POST /api/exams/:id/otp/verify` | **PASSED** |
| 8 | Exam Session Initialization | `POST /api/exams/:id/start` | **PASSED** |
| 9 | Single-Attempt Constraint (Duplicate attempt blocked) | `POST /api/exams/:id/start` | **PASSED** |
| 10 | Server-Side Answer Evaluation & Score Calculation | `POST /api/attempts/:id/submit` | **PASSED** |
| 11 | Result & Leaderboard Lockdown before Admin Release | `GET /api/students/leaderboard/:id` | **PASSED** |
| 12 | Admin One-Click Result Release | `POST /api/admin/exams/:id/release-result` | **PASSED** |
| 13 | Student Real-Time Leaderboard Post-Release | `GET /api/students/leaderboard/:id` | **PASSED** |
| 14 | Student Official Scorecard Post-Release | `GET /api/students/results` | **PASSED** |
| 15 | Admin Live Dashboard Metrics Aggregation | `GET /api/admin/dashboard` | **PASSED** |
| 16 | Account Suspension & Instant Block Guard | `PATCH /api/admin/students/:id/block` | **PASSED** |
| 17 | Student Account Re-Activation | `PATCH /api/admin/students/:id/unblock` | **PASSED** |

### TypeScript Compilation Check:
- Ran `npx tsc --noEmit` on the Frontend: **0 compilation errors**.

---

## 3. Key Business & Security Rules Implemented

1. **Zero Client Trust**: The frontend timer and start button are strictly for visual UX. The backend verifies:
   - Server-side exam start time comparison (`new Date() >= exam.startDateTime`).
   - Server-side 10-minute duration expiry check with grace period.
   - Server-side score calculation (client never sends a score).
2. **Answer Privacy**: The student questions API strips `correctAnswer` and `explanation`.
3. **Compound Unique Index**: `studentId + examId` unique constraint ensures only one attempt per student per exam.
4. **Hashed Active OTP**: 6-digit OTP is hashed with bcrypt. Regenerating an OTP invalidates all previous codes immediately.
5. **Result & Leaderboard Lockdown**: Leaderboard and attempt results return `403 Forbidden` / hidden until `exam.resultReleased === true`.
6. **Account Suspension Security**: The `authenticateJWT` middleware checks `user.status === 'blocked'` on every request, immediately revoking access from suspended students.

---

## 4. Default Seed Accounts

- **Admin Account**:
  - Email: `admin@exam.com`
  - Password: `Admin@12345`
  - Role: `admin`
- **Student Account**:
  - Email: `rahul@student.com`
  - Password: `Student@12345`
  - Role: `student`
- **Sample 50-MCQ Exam**:
  - Title: `React Native & Full-Stack Fundamentals`
  - Questions: 50 MCQs
  - Duration: 10 Minutes
  - Active OTP: `583921`
