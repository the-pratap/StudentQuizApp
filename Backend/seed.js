require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/UserSchema');
const Exam = require('./models/ExamSchema');
const Question = require('./models/QuestionSchema');
const Attempt = require('./models/AttemptSchema');
const OTP = require('./models/OTPSchema');
const connectDB = require('./config/Database');

const questionsData = [
  {
    questionNumber: 1,
    questionText: "What layout engine is used by React Native to calculate flexbox dimensions on mobile devices?",
    options: ["Yoga", "Gecko", "Blink", "WebKit"],
    correctAnswer: "A",
    marks: 1,
    explanation: "React Native uses Meta's Yoga layout engine to implement Flexbox calculations across iOS and Android."
  },
  {
    questionNumber: 2,
    questionText: "Which React Native component is optimized for rendering large, scrollable lists of data efficiently using virtualization?",
    options: ["ScrollView", "FlatList", "SectionList", "VirtualView"],
    correctAnswer: "B",
    marks: 1,
    explanation: "FlatList only renders items currently visible on screen, recycling item views for high performance."
  },
  {
    questionNumber: 3,
    questionText: "In Expo Router, which special file name is used to define nested layout wrappers for grouped routes?",
    options: ["index.tsx", "_layout.tsx", "App.tsx", "router.config.ts"],
    correctAnswer: "B",
    marks: 1,
    explanation: "_layout.tsx is used by Expo Router to wrap child routes with navigators like Stack or Tabs."
  },
  {
    questionNumber: 4,
    questionText: "Which hook should be used in React to memorize expensive calculation results across re-renders?",
    options: ["useCallback", "useMemo", "useRef", "useEffect"],
    correctAnswer: "B",
    marks: 1,
    explanation: "useMemo caches the computed value and recomputes only when specified dependencies change."
  },
  {
    questionNumber: 5,
    questionText: "What does JSX stand for in React / React Native development?",
    options: ["JavaScript XML", "Java Syntax Extension", "JSON Serialization XML", "JavaScript Xerox"],
    correctAnswer: "A",
    marks: 1,
    explanation: "JSX stands for JavaScript XML, providing a syntax sugar for React.createElement calls."
  },
  {
    questionNumber: 6,
    questionText: "What HTTP status code is most appropriate when a student tries to access an Admin-only endpoint without authorization?",
    options: ["400 Bad Request", "401 Unauthorized", "403 Forbidden", "404 Not Found"],
    correctAnswer: "C",
    marks: 1,
    explanation: "403 Forbidden indicates the server understood the identity but refuses authorization for that role."
  },
  {
    questionNumber: 7,
    questionText: "In Node.js Express, what is the correct signature for an Express error-handling middleware function?",
    options: ["(req, res, next)", "(err, req, res, next)", "(error, response)", "(req, res)"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Express recognizes error handlers by their 4 parameters: (err, req, res, next)."
  },
  {
    questionNumber: 8,
    questionText: "Which parts constitute a JSON Web Token (JWT)?",
    options: ["Key, Token, Value", "Header, Payload, Signature", "Id, Session, Hash", "Issuer, Subject, Claim"],
    correctAnswer: "B",
    marks: 1,
    explanation: "A standard JWT consists of three base64url encoded parts: Header, Payload, and Signature separated by dots."
  },
  {
    questionNumber: 9,
    questionText: "Which Mongoose method is used to enforce that a student can have at most one attempt document per exam?",
    options: ["Schema.index({ studentId: 1, examId: 1 }, { unique: true })", "Schema.setUnique('studentId')", "Schema.oneToOne()", "Schema.lockAttempt()"],
    correctAnswer: "A",
    marks: 1,
    explanation: "Compound unique index on (studentId, examId) guarantees database-level single-attempt integrity."
  },
  {
    questionNumber: 10,
    questionText: "Why is bcrypt hashing preferred over plain MD5 or SHA256 for password storage?",
    options: ["It produces shorter strings", "It includes automatic salt generation and work factors resistant to GPU brute-force", "It runs faster than MD5", "It encrypts in two-way format"],
    correctAnswer: "B",
    marks: 1,
    explanation: "bcrypt is an adaptive key derivation function with configurable salt and cost factor designed to thwart hardware cracking."
  },
  {
    questionNumber: 11,
    questionText: "What is the primary purpose of SafeAreaView in React Native?",
    options: ["To encrypt user passwords", "To render content within the safe area boundaries of notches, status bars, and home indicators", "To protect against SQL injection", "To optimize image compression"],
    correctAnswer: "B",
    marks: 1,
    explanation: "SafeAreaView applies paddings to avoid screen notches, status bars, and navigation gesture bars."
  },
  {
    questionNumber: 12,
    questionText: "In React Native, which unit is used by default for numeric values in style properties like fontSize and margin?",
    options: ["Pixels (px)", "Density-independent pixels (dp/pt)", "Centimeters (cm)", "Percentages (%)"],
    correctAnswer: "B",
    marks: 1,
    explanation: "React Native dimensions are density-independent points (dp on Android, pt on iOS)."
  },
  {
    questionNumber: 13,
    questionText: "Which component should be used in React Native for high-performance touch interactions with visual ripple on Android?",
    options: ["TouchableHighlight", "Pressable", "ClickableSpan", "DivButton"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Pressable is the modern core component providing access to detailed press interaction lifecycles and Android ripple."
  },
  {
    questionNumber: 14,
    questionText: "Which hook should be used to persist a mutable value that does NOT trigger a component re-render when changed?",
    options: ["useState", "useRef", "useReducer", "useLayoutEffect"],
    correctAnswer: "B",
    marks: 1,
    explanation: "useRef returns a mutable object whose .current property persists across renders without causing a re-render."
  },
  {
    questionNumber: 15,
    questionText: "What is the default flexDirection in React Native styles?",
    options: ["row", "column", "row-reverse", "column-reverse"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Unlike web CSS (which defaults to row), React Native Flexbox defaults to 'column'."
  },
  {
    questionNumber: 16,
    questionText: "Which method in Mongoose is used to reference and populate documents from another collection?",
    options: ["aggregateJoin()", "populate()", "foreignKey()", "linkDocs()"],
    correctAnswer: "B",
    marks: 1,
    explanation: "populate() replaces specified paths in the document with document(s) from other collections based on ref."
  },
  {
    questionNumber: 17,
    questionText: "Which HTTP method should be used when an Admin wants to toggle a student status from active to blocked?",
    options: ["GET", "PATCH / PUT", "DELETE", "HEAD"],
    correctAnswer: "B",
    marks: 1,
    explanation: "PATCH is ideal for partial resource updates such as toggling a student's status."
  },
  {
    questionNumber: 18,
    questionText: "Where should exam answers and scores be calculated in a secure online examination application?",
    options: ["In React Native state on the mobile device", "Exclusively on the server backend by comparing with database keys", "In local SQLite storage", "In the client browser window"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Scores must always be calculated server-side to prevent tampering and answer leakage."
  },
  {
    questionNumber: 19,
    questionText: "In TypeScript, what keyword is used to enforce that an object cannot have its properties reassigned?",
    options: ["static", "readonly", "sealed", "immutable"],
    correctAnswer: "B",
    marks: 1,
    explanation: "The 'readonly' modifier makes properties unmodifiable after object initialization."
  },
  {
    questionNumber: 20,
    questionText: "What is the purpose of the 'helmet' middleware in Express.js?",
    options: ["To format JSON responses", "To secure Express apps by setting various HTTP response security headers", "To speed up MongoDB queries", "To compress image uploads"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Helmet helps protect Express apps from well-known web vulnerabilities by setting HTTP headers appropriately."
  },
  {
    questionNumber: 21,
    questionText: "How should an expired exam timer be handled when the countdown reaches 00:00?",
    options: ["Allow the student to keep typing answers indefinitely", "Automatically submit the attempt to the backend and mark submissionType as timeout", "Crash the app", "Clear all student answers without saving"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Auto-submission on timer expiry saves all marked answers and securely completes the attempt session."
  },
  {
    questionNumber: 22,
    questionText: "What is the purpose of CORS in web API servers?",
    options: ["Cross-Origin Resource Sharing controls which frontend origins are permitted to access the server", "Compress Object Resource Streams", "Create Optimal Route Schemas", "Compile React Native Scripts"],
    correctAnswer: "A",
    marks: 1,
    explanation: "CORS is a security mechanism using HTTP headers to tell browsers/clients which origins have permission to read resources."
  },
  {
    questionNumber: 23,
    questionText: "In React Native, which package is standard for persistent offline key-value storage?",
    options: ["@react-native-async-storage/async-storage", "localStorage", "window.sessionStorage", "cookie-parser"],
    correctAnswer: "A",
    marks: 1,
    explanation: "AsyncStorage is the community standard asynchronous, unencrypted, persistent key-value storage system for React Native."
  },
  {
    questionNumber: 24,
    questionText: "What is the primary benefit of TypeScript interfaces in a full-stack project?",
    options: ["They generate runtime byte-code", "They provide compile-time type safety, contract enforcement, and autocompletion", "They replace the database layer", "They encrypt network packets"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Interfaces define code contracts, preventing bugs through static analysis before code runs."
  },
  {
    questionNumber: 25,
    questionText: "What is the purpose of MongoDB Aggregation Pipeline?",
    options: ["To design CSS mockups", "To process and transform data documents through multi-stage operations like $match, $group, $sort", "To install npm packages", "To create mobile APKs"],
    correctAnswer: "B",
    marks: 1,
    explanation: "MongoDB aggregation pipelines allow complex data analytics, grouping, and transformations on the database engine."
  },
  {
    questionNumber: 26,
    questionText: "What does the 'key' prop do when rendering lists in React / React Native?",
    options: ["It encrypts the list items", "It gives elements a stable identity so React can identify which items changed, added, or removed", "It sets the CSS keyframe animation", "It determines the database primary key"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Keys help React's virtual DOM reconciliation algorithm identify which items have changed or need re-rendering."
  },
  {
    questionNumber: 27,
    questionText: "Which React hook is used to perform side effects such as fetching data when a component mounts?",
    options: ["useMount", "useEffect", "useAction", "useFetch"],
    correctAnswer: "B",
    marks: 1,
    explanation: "useEffect with an empty dependency array [] executes side-effects after the initial render."
  },
  {
    questionNumber: 28,
    questionText: "What is the role of the 'morgan' library in a Node.js Express server?",
    options: ["Database ORM", "HTTP request logging middleware", "JWT encoder", "File compression tool"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Morgan is an HTTP request logger middleware for Node.js commonly used in development and debugging."
  },
  {
    questionNumber: 29,
    questionText: "Which status code indicates a successfully created resource in a REST API?",
    options: ["200 OK", "201 Created", "202 Accepted", "204 No Content"],
    correctAnswer: "B",
    marks: 1,
    explanation: "201 Created signifies that the request succeeded and led to the creation of a new resource."
  },
  {
    questionNumber: 30,
    questionText: "In Expo Router, how do you group route folders without affecting the URL path segment?",
    options: ["Prefix with an underscore (_tabs)", "Enclose in parentheses like (tabs) or (auth)", "Prefix with dot (.tabs)", "Use square brackets [tabs]"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Parentheses (group_name) create route groups in Expo Router without adding segments to the URL path."
  },
  {
    questionNumber: 31,
    questionText: "How should question correct answers be handled in the student-facing exam questions API?",
    options: ["Sent in plain text in the JSON payload", "Never included in the response payload sent to students", "Encoded with ROT13", "Hidden in an HTML comment"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Student APIs must never expose correctAnswer under any circumstances to prevent cheating via network inspection."
  },
  {
    questionNumber: 32,
    questionText: "What is the purpose of the 'ActivityIndicator' component in React Native?",
    options: ["Displays a circular loading spinner", "Logs user analytics", "Calculates battery usage", "Plays video files"],
    correctAnswer: "A",
    marks: 1,
    explanation: "ActivityIndicator renders a native circular loading indicator on iOS and Android."
  },
  {
    questionNumber: 33,
    questionText: "Which HTTP header is standard for transmitting JWT Bearer tokens?",
    options: ["Cookie", "Authorization: Bearer <token>", "X-Auth-Key", "Content-Security"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Bearer tokens are standardly transmitted in the Authorization header: 'Authorization: Bearer <token>'."
  },
  {
    questionNumber: 34,
    questionText: "What design paradigm uses translucent backgrounds, multi-layer blur effects, and subtle borders?",
    options: ["Neumorphism", "Glassmorphism", "Skeuomorphism", "Flat Design 1.0"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Glassmorphism is characterized by background blur, semi-transparent layered surfaces, and vibrant borders."
  },
  {
    questionNumber: 35,
    questionText: "Which method in JavaScript array creates a new array populated with the results of calling a provided function on every element?",
    options: ["forEach()", "map()", "filter()", "reduce()"],
    correctAnswer: "B",
    marks: 1,
    explanation: "map() transforms each element of an array into a new array of the same length."
  },
  {
    questionNumber: 36,
    questionText: "In MongoDB, what does the '_id' field represent?",
    options: ["A randomly generated string", "A 12-byte BSON ObjectId serving as the document's primary key", "A database table name", "A timestamp integer"],
    correctAnswer: "B",
    marks: 1,
    explanation: "_id is the default primary key in MongoDB collections, usually an ObjectId containing timestamp, machine ID, and counter."
  },
  {
    questionNumber: 37,
    questionText: "Which hook allows a child component in React Native to access global auth state without prop drilling?",
    options: ["useContext", "useCallback", "useHistory", "useImperativeHandle"],
    correctAnswer: "A",
    marks: 1,
    explanation: "useContext subscribes to React context, allowing components anywhere in the tree to read provided values."
  },
  {
    questionNumber: 38,
    questionText: "What is the recommended way to handle network request failures gracefully in React Native?",
    options: ["Crash the app", "Display user-friendly error states with a retry button", "Silently ignore the error", "Force close the phone"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Modern apps show clean error state cards with descriptive messages and retry actions."
  },
  {
    questionNumber: 39,
    questionText: "What does dotenv do in a Node.js backend project?",
    options: ["Compiles TypeScript to JavaScript", "Loads environment variables from a .env file into process.env", "Generates API documentation", "Minifies CSS files"],
    correctAnswer: "B",
    marks: 1,
    explanation: "dotenv is a zero-dependency module that loads environment variables from a .env file into process.env."
  },
  {
    questionNumber: 40,
    questionText: "Which component is best suited for rendering modal dialogs, popups, and confirmation sheets in React Native?",
    options: ["Modal", "PopupBox", "FloatingWindow", "AlertScreen"],
    correctAnswer: "A",
    marks: 1,
    explanation: "Modal is the built-in React Native component to present content above an enclosing view."
  },
  {
    questionNumber: 41,
    questionText: "In an exam system, what should happen when a student submits an exam before the administrator releases results?",
    options: ["Student receives their full score and correct answer key immediately", "Exam is recorded, but result and leaderboard remain hidden until admin explicitly releases them", "The attempt is deleted", "The admin is locked out"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Result confidentiality ensures results remain hidden until administrative evaluation and release."
  },
  {
    questionNumber: 42,
    questionText: "Which array method returns the index of the first element that satisfies the provided testing function?",
    options: ["indexOf()", "findIndex()", "search()", "lookup()"],
    correctAnswer: "B",
    marks: 1,
    explanation: "findIndex() returns the index of the first element in an array that satisfies a testing function, or -1 if none match."
  },
  {
    questionNumber: 43,
    questionText: "In TypeScript, what is the type of a variable that can be either a string or a number?",
    options: ["string & number", "string | number", "string + number", "any[]"],
    correctAnswer: "B",
    marks: 1,
    explanation: "A union type (string | number) allows a value to be any one of the specified types."
  },
  {
    questionNumber: 44,
    questionText: "What is the purpose of 'StyleSheet.create' in React Native?",
    options: ["It defines HTML tags", "It validates styles and creates immutable style references for performance optimization", "It connects to MongoDB", "It minifies images"],
    correctAnswer: "B",
    marks: 1,
    explanation: "StyleSheet.create validates style properties and sends them across the bridge as IDs for performance."
  },
  {
    questionNumber: 45,
    questionText: "Which status code represents 404 in HTTP?",
    options: ["Internal Server Error", "Not Found", "Unauthorized", "Forbidden"],
    correctAnswer: "B",
    marks: 1,
    explanation: "404 Not Found indicates that the requested resource could not be found on the server."
  },
  {
    questionNumber: 46,
    questionText: "In MongoDB, what does the $set operator do during an updateOne operation?",
    options: ["Replaces the entire document with an empty object", "Replaces only the value of a field with the specified value", "Creates a new collection", "Deletes the database"],
    correctAnswer: "B",
    marks: 1,
    explanation: "$set replaces the value of a specified field with the given value without altering other fields."
  },
  {
    questionNumber: 47,
    questionText: "What happens if a blocked student attempts to make an authenticated API request?",
    options: ["The request succeeds normally", "The authenticateJWT middleware detects status === 'blocked' and returns a 403 Forbidden error", "The server restarts", "The user is promoted to admin"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Middleware checks user status in real-time on every request, blocking suspended accounts immediately."
  },
  {
    questionNumber: 48,
    questionText: "How are questions in an exam navigated in a professional mobile quiz UI?",
    options: ["Only backwards", "Through Previous/Next buttons and a 1-to-N interactive question palette grid showing answered states", "By restarting the mobile device", "By typing SQL queries"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Interactive question palettes and next/prev controls provide intuitive, rapid navigation."
  },
  {
    questionNumber: 49,
    questionText: "What is the difference between '==' and '===' in JavaScript?",
    options: ["There is no difference", "=== compares both value and type without type coercion, whereas == performs type coercion", "== is only for numbers", "=== is obsolete"],
    correctAnswer: "B",
    marks: 1,
    explanation: "Strict equality (===) checks value and type without implicit type conversion."
  },
  {
    questionNumber: 50,
    questionText: "What is the primary role of an Exam OTP in a secure examination environment?",
    options: ["To format text fonts", "To act as a one-time session passphrase ensuring only authorized students present in the exam hall can start", "To compress video files", "To reset mobile passwords"],
    correctAnswer: "B",
    marks: 1,
    explanation: "An OTP generated by the Admin ensures students can only start the exam when officially instructed."
  }
];

async function seedDatabase() {
  try {
    console.log('[Seeder] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seeder] Clearing previous collections (User, Exam, Question, Attempt, OTP)...');
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      Question.deleteMany({}),
      Attempt.deleteMany({}),
      OTP.deleteMany({}),
    ]);

    // 1. Seed Admin
    console.log('[Seeder] Creating Admin account...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@exam.com',
      password: 'Admin@12345',
      role: 'admin',
      status: 'active',
    });
    console.log(`[Seeder] Admin created: admin@exam.com / Admin@12345 (ID: ${adminUser._id})`);

    // 2. Seed Students
    console.log('[Seeder] Creating Student accounts...');
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@student.com',
      password: 'Student@12345',
      role: 'student',
      status: 'active',
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@student.com',
      password: 'Student@12345',
      role: 'student',
      status: 'active',
    });

    const student3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit@student.com',
      password: 'Student@12345',
      role: 'student',
      status: 'active',
    });
    console.log('[Seeder] Students created: rahul@student.com, priya@student.com, amit@student.com / Student@12345');

    // 3. Create Sample 50-MCQ Exam
    console.log('[Seeder] Creating Full 50-MCQ Exam...');
    const now = new Date();
    // Set start time to 2 hours ago so it is ACTIVE and ready to start right now
    const activeStartTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const dateStr = now.toISOString().split('T')[0];

    const exam = await Exam.create({
      title: 'React Native & Full-Stack Fundamentals',
      description: 'Comprehensive 50-MCQ online examination testing React Native, Expo Router, TypeScript, Express, and MongoDB architecture.',
      subject: 'Mobile & Web Systems',
      examDate: dateStr,
      startTime: '08:00 AM',
      startDateTime: activeStartTime,
      durationMinutes: 10,
      totalQuestions: 50,
      status: 'ACTIVE',
      resultReleased: false,
      createdBy: adminUser._id,
    });

    // 4. Create 50 Questions
    console.log('[Seeder] Inserting 50 MCQ questions into database...');
    const questionsToInsert = questionsData.map((q) => ({
      examId: exam._id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation,
    }));

    await Question.insertMany(questionsToInsert);
    console.log('[Seeder] 50 Questions inserted successfully!');

    // 5. Generate and seed Active OTP for this exam
    const sampleOtp = '583921';
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(sampleOtp, salt);

    await OTP.create({
      examId: exam._id,
      otpHash,
      rawOtp: sampleOtp,
      expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Valid for 48 hours
      isActive: true,
      createdBy: adminUser._id,
    });
    console.log(`[Seeder] Active OTP created for exam: ${sampleOtp}`);

    console.log('\n======================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY');
    console.log('======================================================');
    console.log(' Default Admin Login:');
    console.log('   Email:    admin@exam.com');
    console.log('   Password: Admin@12345');
    console.log(' Default Student Login:');
    console.log('   Email:    rahul@student.com');
    console.log('   Password: Student@12345');
    console.log(' Active Exam:');
    console.log(`   Title:    ${exam.title}`);
    console.log(`   OTP:      ${sampleOtp}`);
    console.log(`   Duration: 10 Minutes (50 Questions)`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
}

seedDatabase();
