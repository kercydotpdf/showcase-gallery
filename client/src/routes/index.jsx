import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RedirectIfAuthed } from "./guards";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminStudents from "../pages/admin/Students";
import AdminTeachers from "../pages/admin/Teachers";
import AdminSubjects from "../pages/admin/Subjects";
import AdminClasses from "../pages/admin/Classes";
import AdminClassDetail from "../pages/admin/ClassDetail";
import AnnouncementsPage from "../pages/shared/AnnouncementsPage";

import TeacherDashboard from "../pages/teacher/Dashboard";
import TeacherClasses from "../pages/teacher/Classes";
import TeacherClassDetail from "../pages/teacher/ClassDetail";

import StudentDashboard from "../pages/student/Dashboard";
import StudentClasses from "../pages/student/Classes";
import StudentClassDetail from "../pages/student/ClassDetail";
import StudentAssignments from "../pages/student/Assignments";
import StudentGrades from "../pages/student/Grades";
import TakeQuiz from "../pages/student/TakeQuiz";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RedirectIfAuthed />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Admin */}
      <Route element={<RequireAuth roles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminStudents />} />
        <Route path="/admin/teachers" element={<AdminTeachers />} />
        <Route path="/admin/subjects" element={<AdminSubjects />} />
        <Route path="/admin/classes" element={<AdminClasses />} />
        <Route path="/admin/classes/:id" element={<AdminClassDetail />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage canPost />} />
      </Route>

      {/* Teacher */}
      <Route element={<RequireAuth roles={["teacher"]} />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/classes/:id" element={<TeacherClassDetail />} />
        <Route path="/teacher/announcements" element={<AnnouncementsPage canPost />} />
      </Route>

      {/* Student */}
      <Route element={<RequireAuth roles={["student"]} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/classes" element={<StudentClasses />} />
        <Route path="/student/classes/:id" element={<StudentClassDetail />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/student/grades" element={<StudentGrades />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/quizzes/:quizId" element={<TakeQuiz />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
