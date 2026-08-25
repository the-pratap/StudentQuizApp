require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/Database');

let server;
let adminToken = '';
let studentToken = '';
let examId = '';
let attemptId = '';
let testStudentId = '';

const BASE_PORT = 5055;

function makeRequest({ method, path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqOptions = {
      hostname: '127.0.0.1',
      port: BASE_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================');
  console.log(' RUNNING AUTOMATED FULL-STACK API TESTS');
  console.log('=============================================\n');

  await connectDB();
  server = app.listen(BASE_PORT);

  try {
    // 1. Health check
    console.log('[Test 1] GET /api/health');
    const health = await makeRequest({ method: 'GET', path: '/api/health' });
    console.log('Status:', health.status, 'Success:', health.data.success);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Admin Login
    console.log('\n[Test 2] POST /api/auth/login (Admin)');
    const adminLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@exam.com', password: 'Admin@12345' },
    });
    console.log('Status:', adminLogin.status, 'User Role:', adminLogin.data.data?.user?.role);
    if (adminLogin.status !== 200 || adminLogin.data.data?.user?.role !== 'admin') {
      throw new Error('Admin login failed');
    }
    adminToken = adminLogin.data.data.token;

    // 3. Student Login
    console.log('\n[Test 3] POST /api/auth/login (Student)');
    const studentLogin = await makeRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'rahul@student.com', password: 'Student@12345' },
    });
    console.log('Status:', studentLogin.status, 'User Role:', studentLogin.data.data?.user?.role);
    if (studentLogin.status !== 200 || studentLogin.data.data?.user?.role !== 'student') {
      throw new Error('Student login failed');
    }
    studentToken = studentLogin.data.data.token;
    testStudentId = studentLogin.data.data.user.id;

    // 4. Student Registration & Duplicate Prevention
    console.log('\n[Test 4] POST /api/auth/register (Duplicate prevention)');
    const dupReg = await makeRequest({
      method: 'POST',
      path: '/api/auth/register',
      body: { name: 'Rahul Sharma', email: 'rahul@student.com', password: 'Student@12345' },
    });
    console.log('Status:', dupReg.status, 'Message:', dupReg.data.message);
    if (dupReg.status !== 400 || !dupReg.data.message.includes('already registered')) {
      throw new Error('Duplicate email test failed');
    }

    // 5. Get Exams
    console.log('\n[Test 5] GET /api/exams');
    const examsRes = await makeRequest({
      method: 'GET',
      path: '/api/exams',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', examsRes.status, 'Exams Count:', examsRes.data.data?.length);
    if (examsRes.status !== 200 || !examsRes.data.data?.length) {
      throw new Error('Get exams failed');
    }
    examId = examsRes.data.data[0].id;
    console.log('Exam ID:', examId, 'Status:', examsRes.data.data[0].status);

    // 6. Question Sanitization Security (Student must NOT see correctAnswer)
    console.log('\n[Test 6] GET /api/exams/:id/questions (Student Security Check)');
    const studentQuestions = await makeRequest({
      method: 'GET',
      path: `/api/exams/${examId}/questions`,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', studentQuestions.status, 'Questions Count:', studentQuestions.data.count);
    const hasLeakedAnswer = studentQuestions.data.data.some((q) => q.correctAnswer !== undefined);
    if (hasLeakedAnswer) {
      throw new Error('SECURITY VIOLATION: Student API returned correctAnswer!');
    }
    console.log('-> Security Passed: No correctAnswer exposed in student payload!');

    // 7. OTP Verification (Invalid vs Valid)
    console.log('\n[Test 7] POST /api/exams/:id/otp/verify (Invalid OTP)');
    const invalidOtpRes = await makeRequest({
      method: 'POST',
      path: `/api/exams/${examId}/otp/verify`,
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { otp: '000000' },
    });
    console.log('Status:', invalidOtpRes.status, 'Message:', invalidOtpRes.data.message);
    if (invalidOtpRes.status !== 400) throw new Error('Invalid OTP check failed');

    console.log('POST /api/exams/:id/otp/verify (Valid OTP 583921)');
    const validOtpRes = await makeRequest({
      method: 'POST',
      path: `/api/exams/${examId}/otp/verify`,
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { otp: '583921' },
    });
    console.log('Status:', validOtpRes.status, 'Message:', validOtpRes.data.message);
    if (validOtpRes.status !== 200) throw new Error('Valid OTP check failed');

    // 8. Start Exam Attempt
    console.log('\n[Test 8] POST /api/exams/:id/start');
    const startExamRes = await makeRequest({
      method: 'POST',
      path: `/api/exams/${examId}/start`,
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { otp: '583921' },
    });
    console.log('Status:', startExamRes.status, 'Attempt ID:', startExamRes.data.data?.attemptId);
    if (startExamRes.status !== 201) throw new Error('Start exam failed');
    attemptId = startExamRes.data.data.attemptId;

    // 9. Single Attempt Constraint (Cannot start second time!)
    console.log('\n[Test 9] POST /api/exams/:id/start (Second attempt block)');
    const secondAttemptRes = await makeRequest({
      method: 'POST',
      path: `/api/exams/${examId}/start`,
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { otp: '583921' },
    });
    console.log('Status:', secondAttemptRes.status, 'Message:', secondAttemptRes.data.message);
    if (secondAttemptRes.status !== 400 || secondAttemptRes.data.error !== 'ALREADY_ATTEMPTED') {
      throw new Error('Single attempt constraint failed');
    }
    console.log('-> Security Passed: Single attempt rule successfully enforced!');

    // 10. Submit Exam Answers
    console.log('\n[Test 10] POST /api/attempts/:id/submit');
    const answersToSubmit = studentQuestions.data.data.slice(0, 5).map((q, idx) => ({
      questionId: q.id,
      selectedOption: idx % 2 === 0 ? 'A' : 'B', // mark some answers
    }));

    const submitRes = await makeRequest({
      method: 'POST',
      path: `/api/attempts/${attemptId}/submit`,
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { answers: answersToSubmit, isTimeout: false },
    });
    console.log('Status:', submitRes.status, 'Message:', submitRes.data.message);
    console.log('Result Released?:', submitRes.data.data?.resultReleased);
    if (submitRes.status !== 200) throw new Error('Submit exam failed');

    // 11. Leaderboard Protected before release
    console.log('\n[Test 11] GET /api/students/leaderboard/:id (Before release)');
    const preReleaseLeaderboard = await makeRequest({
      method: 'GET',
      path: `/api/students/leaderboard/${examId}`,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', preReleaseLeaderboard.status, 'Message:', preReleaseLeaderboard.data.message);
    if (preReleaseLeaderboard.status !== 403) throw new Error('Leaderboard should be blocked before release');
    console.log('-> Security Passed: Leaderboard hidden until Admin releases result!');

    // 12. Admin Releases Result
    console.log('\n[Test 12] POST /api/admin/exams/:id/release-result (Admin Action)');
    const releaseRes = await makeRequest({
      method: 'POST',
      path: `/api/admin/exams/${examId}/release-result`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Status:', releaseRes.status, 'Message:', releaseRes.data.message);
    if (releaseRes.status !== 200 || !releaseRes.data.data?.resultReleased) {
      throw new Error('Result release failed');
    }

    // 13. Student Checks Leaderboard & Results (Now accessible!)
    console.log('\n[Test 13] GET /api/students/leaderboard/:id (After release)');
    const postReleaseLeaderboard = await makeRequest({
      method: 'GET',
      path: `/api/students/leaderboard/${examId}`,
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', postReleaseLeaderboard.status, 'Participants:', postReleaseLeaderboard.data.totalParticipants);
    if (postReleaseLeaderboard.status !== 200) throw new Error('Leaderboard after release failed');

    console.log('\n[Test 14] GET /api/students/results (Student View)');
    const studentResults = await makeRequest({
      method: 'GET',
      path: '/api/students/results',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', studentResults.status, 'Score:', studentResults.data.data?.[0]?.score);
    if (studentResults.status !== 200) throw new Error('Student results fetch failed');

    // 14. Admin Dashboard Metrics
    console.log('\n[Test 15] GET /api/admin/dashboard');
    const adminDash = await makeRequest({
      method: 'GET',
      path: '/api/admin/dashboard',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Status:', adminDash.status, 'Metrics:', adminDash.data.data?.metrics);
    if (adminDash.status !== 200) throw new Error('Admin dashboard fetch failed');

    // 15. Student Block / Unblock Check
    console.log('\n[Test 16] PATCH /api/admin/students/:id/block');
    const blockRes = await makeRequest({
      method: 'PATCH',
      path: `/api/admin/students/${testStudentId}/block`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Status:', blockRes.status, 'Student Status:', blockRes.data.data?.status);
    if (blockRes.status !== 200 || blockRes.data.data?.status !== 'blocked') {
      throw new Error('Block student failed');
    }

    console.log('Blocked Student API Access Check (should return 403 ACCOUNT_BLOCKED)');
    const blockedCheck = await makeRequest({
      method: 'GET',
      path: '/api/students/profile',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log('Status:', blockedCheck.status, 'Error Code:', blockedCheck.data.error);
    if (blockedCheck.status !== 403 || blockedCheck.data.error !== 'ACCOUNT_BLOCKED') {
      throw new Error('Blocked student access guard failed');
    }
    console.log('-> Security Passed: Blocked student rejected from protected routes!');

    // Unblock student
    console.log('\n[Test 17] PATCH /api/admin/students/:id/unblock');
    await makeRequest({
      method: 'PATCH',
      path: `/api/admin/students/${testStudentId}/unblock`,
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Student unblocked successfully!');

    console.log('\n======================================================');
    console.log(' ALL 17 AUTOMATED TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n[Test Failed]:', err);
    process.exit(1);
  } finally {
    if (server) server.close();
    process.exit(0);
  }
}

runTests();
