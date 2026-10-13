/**
 * Repeatable seed script for local development / demonstrations.
 *
 *   npm run seed            -> admin + demo data
 *   npm run seed:admin      -> administrator account only
 *
 * Every record is found-or-created by a natural key (email / code / title),
 * so running it twice never creates duplicates.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Class from "../models/Class.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Material from "../models/Material.js";
import Assignment from "../models/Assignment.js";
import Submission from "../models/Submission.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Announcement from "../models/Announcement.js";

const ADMIN_ONLY = process.argv.includes("--admin-only");
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@school.edu";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "Administrator";

const TEACHER_EMAIL = process.env.SEED_TEACHER_EMAIL || "teacher@school.edu";
const TEACHER_PASSWORD = process.env.SEED_TEACHER_PASSWORD || "Teacher@123";
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || "Student@123";

const created = { users: 0, subjects: 0, classes: 0, content: 0 };

async function upsertUser({ name, email, password, role, ...rest }) {
  let user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) {
    user = await User.create({ name, email, password, role, ...rest });
    created.users += 1;
    console.log(`  + ${role}: ${email}`);
    return user;
  }
  user.name = name;
  user.role = role;
  Object.assign(user, rest);
  if (password && !(await user.matchPassword(password))) user.password = password;
  if (!user.active) user.active = true;
  await user.save();
  return user;
}

async function upsertSubject({ code, title, description }) {
  let s = await Subject.findOne({ code });
  if (!s) {
    s = await Subject.create({ code, title, description });
    created.subjects += 1;
    console.log(`  + subject: ${code}`);
  } else {
    s.title = title;
    s.description = description;
    await s.save();
  }
  return s;
}

async function seed() {
  await connectDB();

  console.log("Seeding administrator...");
  await upsertUser({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  if (ADMIN_ONLY) {
    await mongoose.disconnect();
    console.log("\nAdmin-only seed finished.");
    return;
  }

  console.log("Seeding demo accounts...");
  const teacher = await upsertUser({
    name: "Maria Santos",
    email: TEACHER_EMAIL,
    password: TEACHER_PASSWORD,
    role: "teacher",
    department: "Information Technology",
  });

  const studentData = [
    { name: "John Dela Cruz", email: "student@school.edu", studentNo: "2024-0001" },
    { name: "Ana Reyes", email: "student2@school.edu", studentNo: "2024-0002" },
    { name: "Mark Villanueva", email: "student3@school.edu", studentNo: "2024-0003" },
    { name: "Sofia Lim", email: "student4@school.edu", studentNo: "2024-0004" },
  ];
  const students = [];
  for (const s of studentData) {
    students.push(
      await upsertUser({ ...s, password: STUDENT_PASSWORD, role: "student" })
    );
  }

  console.log("Seeding subjects...");
  const inf232 = await upsertSubject({
    code: "INF232",
    title: "Fundamentals of Information Technology",
    description: "Introduction to computer systems, hardware, software and networks.",
  });
  const math101 = await upsertSubject({
    code: "MATH101",
    title: "College Algebra",
    description: "Functions, equations, matrices and their applications.",
  });

  console.log("Seeding classes...");
  let classA = await Class.findOne({ name: "BSIT 2A" });
  if (!classA) {
    classA = await Class.create({
      name: "BSIT 2A",
      subject: inf232._id,
      teacher: teacher._id,
      students: students.map((s) => s._id),
      schedule: "MWF 8:00 - 9:00 AM",
    });
    created.classes += 1;
    console.log("  + class: BSIT 2A");
  } else {
    classA.subject = inf232._id;
    classA.teacher = teacher._id;
    classA.students = students.map((s) => s._id);
    await classA.save();
  }

  let classB = await Class.findOne({ name: "BSIT 2B" });
  if (!classB) {
    classB = await Class.create({
      name: "BSIT 2B",
      subject: math101._id,
      teacher: teacher._id,
      students: students.slice(0, 2).map((s) => s._id),
      schedule: "TTH 10:00 - 11:30 AM",
    });
    created.classes += 1;
    console.log("  + class: BSIT 2B");
  }

  console.log("Seeding class content...");
  const [m1, m2] = await Promise.all([
    upsertModule(classA._id, "Module 1 - Introduction to Computing", 0),
    upsertModule(classA._id, "Module 2 - Computer Hardware", 1),
  ]);

  await upsertLesson(m1, classA._id, "What is Information Technology?", 0,
    "Information Technology (IT) is the use of computers, storage, networking and other physical devices,\n\n" +
    "infrastructure and processes to create, process, store, secure and exchange all forms of electronic data.\n\n" +
    "Key points:\n" +
    "- IT supports the day-to-day operations of an organisation.\n" +
    "- It covers hardware, software, networks and data.\n" +
    "- Professionals in this field design, build and maintain systems.");
  await upsertLesson(m1, classA._id, "Brief History of Computers", 1,
    "Generations of computers:\n\n" +
    "1. Vacuum tubes (1940s) - large, slow and expensive.\n" +
    "2. Transistors (1950s) - smaller and more reliable.\n" +
    "3. Integrated circuits (1960s) - many components on one chip.\n" +
    "4. Microprocessors (1970s onward) - the personal computer era.\n" +
    "5. Modern systems - multi-core processors, cloud and mobile computing.");
  await upsertLesson(m2, classA._id, "Hardware Components", 0,
    "A computer is made of physical parts:\n\n" +
    "- CPU - the brain that executes instructions.\n" +
    "- Memory (RAM) - temporary storage while programs run.\n" +
    "- Storage (SSD/HDD) - permanent data storage.\n" +
    "- Input devices - keyboard, mouse, scanner.\n" +
    "- Output devices - monitor, printer, speakers.\n\n" +
    "These components communicate through the motherboard and the system bus.");

  const syllabus = await Material.findOne({ class: classA._id, title: "Course Syllabus" });
  if (!syllabus) {
    await Material.create({
      title: "Course Syllabus",
      type: "link",
      url: "https://example.com/syllabus",
      filename: "",
      size: 0,
      class: classA._id,
      uploadedBy: teacher._id,
    });
    created.content += 1;
  }

  const notes = await Material.findOne({ class: classA._id, title: "Week 1 Study Notes.txt" });
  if (!notes) {
    const body = "INF232 Week 1 Notes\n\n1. Define information technology.\n2. List the five generations of computers.\n3. Identify input and output devices.";
    await Material.create({
      title: "Week 1 Study Notes.txt",
      type: "file",
      url: `data:text/plain;base64,${Buffer.from(body).toString("base64")}`,
      filename: "Week 1 Study Notes.txt",
      size: Buffer.byteLength(body),
      class: classA._id,
      uploadedBy: teacher._id,
    });
    created.content += 1;
  }

  let assignment = await Assignment.findOne({ class: classA._id, title: "Chapter 1 Reflection" });
  if (!assignment) {
    assignment = await Assignment.create({
      title: "Chapter 1 Reflection",
      instructions:
        "Write a 300-word reflection on how information technology changed the way you study.\n\n" +
        "Submission requirements:\n- Plain text or an attached document.\n- Mention at least three technologies you use daily.",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      points: 50,
      class: classA._id,
      createdBy: teacher._id,
    });
    created.content += 1;
    console.log("  + assignment: Chapter 1 Reflection");
  }

  let quiz = await Quiz.findOne({ class: classA._id, title: "Introduction Quiz" });
  if (!quiz) {
    quiz = await Quiz.create({
      title: "Introduction Quiz",
      instructions: "Choose the best answer for each question.",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      allowRetake: false,
      showResult: true,
      questions: [
        {
          question: "Which device is considered the 'brain' of the computer?",
          options: ["Hard drive", "CPU", "Monitor", "Keyboard"],
          correct: 1,
          points: 1,
        },
        {
          question: "Which generation of computers used integrated circuits?",
          options: ["First generation", "Second generation", "Third generation", "Fourth generation"],
          correct: 2,
          points: 1,
        },
        {
          question: "RAM is an example of which type of memory?",
          options: ["Permanent storage", "Secondary storage", "Volatile memory", "Optical storage"],
          correct: 2,
          points: 1,
        },
      ],
      class: classA._id,
      createdBy: teacher._id,
    });
    created.content += 1;
    console.log("  + quiz: Introduction Quiz");
  }

  let announcement = await Announcement.findOne({ class: classA._id, title: "Welcome to INF232!" });
  if (!announcement) {
    await Announcement.create({
      title: "Welcome to INF232!",
      content:
        "Welcome to Fundamentals of Information Technology!\n\n" +
        "Please read Module 1 before our next meeting and submit the Chapter 1 reflection on time.",
      class: classA._id,
      createdBy: teacher._id,
    });
    created.content += 1;
    console.log("  + announcement: Welcome to INF232!");
  }

  // Sample submissions so grading and grades pages have data on first run.
  const sub2 = await Submission.findOne({ assignment: assignment._id, student: students[1]._id });
  if (!sub2) {
    await Submission.create({
      assignment: assignment._id,
      class: classA._id,
      student: students[1]._id,
      content:
        "Technology changed the way I study because I can now search for references online, join virtual classes and keep my notes in the cloud.",
      file: { name: "", url: "" },
    });
    console.log("  + submission (Ana Reyes, awaiting grade)");
  }

  const sub3 = await Submission.findOne({ assignment: assignment._id, student: students[2]._id });
  if (!sub3) {
    await Submission.create({
      assignment: assignment._id,
      class: classA._id,
      student: students[2]._id,
      content:
        "I use a laptop, a smartphone and online libraries every day. These tools let me finish requirements faster and collaborate with classmates.",
      file: { name: "", url: "" },
      status: "graded",
      grade: 45,
      feedback: "Good examples. Remember to follow the 300-word requirement next time.",
      gradedAt: new Date(),
    });
    console.log("  + submission (Mark Villanueva, graded 45/50)");
  }

  const attempt = await QuizAttempt.findOne({ quiz: quiz._id, student: students[0]._id });
  if (!attempt) {
    await QuizAttempt.create({
      quiz: quiz._id,
      class: classA._id,
      student: students[0]._id,
      answers: [1, 2, 2],
      score: 3,
      total: 3,
      attempt: 1,
    });
    console.log("  + quiz attempt (John Dela Cruz, 3/3)");
  }

  await mongoose.disconnect();

  console.log("\nSeed finished.");
  console.log(
    `New records this run - users: ${created.users}, subjects: ${created.subjects}, classes: ${created.classes}, content: ${created.content}`
  );
  console.log("\nDemo accounts (local development only):");
  console.log(`  Admin    ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`);
  console.log(`  Teacher  ${TEACHER_EMAIL}  /  ${TEACHER_PASSWORD}`);
  console.log(`  Student  ${studentData[0].email}  /  ${STUDENT_PASSWORD}`);
}

async function upsertModule(classId, title, order) {
  let m = await Module.findOne({ class: classId, title });
  if (!m) {
    m = await Module.create({ title, class: classId, order, description: "" });
    created.content += 1;
  }
  return m;
}

async function upsertLesson(moduleId, classId, title, order, content) {
  let l = await Lesson.findOne({ module: moduleId, title });
  if (!l) {
    l = await Lesson.create({ title, content, module: moduleId, class: classId, order });
    created.content += 1;
  }
  return l;
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
