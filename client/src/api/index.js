import api from "./client";

/* ------------------------------------------------------------------ auth */
export const login = (email, password) =>
  api("/auth/login", { method: "POST", body: { email, password } });

/** Public sign-up. Students and teachers only — never administrators. */
export const register = (data) => api("/auth/register", { method: "POST", body: data });

export const me = () => api("/auth/me");

export const updateProfile = (data) =>
  api("/auth/profile", { method: "PUT", body: data });

/* ----------------------------------------------------------------- users */
export const listUsers = (params = {}) => api(`/users${qs(params)}`);
export const createUser = (data) => api("/users", { method: "POST", body: data });
export const updateUser = (id, data) => api(`/users/${id}`, { method: "PUT", body: data });
export const deleteUser = (id, hard = false) =>
  api(`/users/${id}${hard ? "?hard=true" : ""}`, { method: "DELETE" });

/* ------------------------------------------------------------- subjects */
export const listSubjects = (params = {}) => api(`/subjects${qs(params)}`);
export const createSubject = (data) => api("/subjects", { method: "POST", body: data });
export const updateSubject = (id, data) => api(`/subjects/${id}`, { method: "PUT", body: data });
export const deleteSubject = (id) => api(`/subjects/${id}`, { method: "DELETE" });

/* --------------------------------------------------------------- classes */
export const listClasses = (params = {}) => api(`/classes${qs(params)}`);
export const getClass = (id) => api(`/classes/${id}`);
export const createClass = (data) => api("/classes", { method: "POST", body: data });
export const updateClass = (id, data) => api(`/classes/${id}`, { method: "PUT", body: data });
export const deleteClass = (id) => api(`/classes/${id}`, { method: "DELETE" });
export const enrollStudent = (classId, studentId) =>
  api(`/classes/${classId}/students`, { method: "POST", body: { studentId } });
export const unenrollStudent = (classId, studentId) =>
  api(`/classes/${classId}/students/${studentId}`, { method: "DELETE" });

/* --------------------------------------------------------- course content */
export const listModules = (classId) => api(`/modules?classId=${classId}`);
export const createModule = (data) => api("/modules", { method: "POST", body: data });
export const updateModule = (id, data) => api(`/modules/${id}`, { method: "PUT", body: data });
export const deleteModule = (id) => api(`/modules/${id}`, { method: "DELETE" });

export const listLessons = (params = {}) => api(`/lessons${qs(params)}`);
export const getLesson = (id) => api(`/lessons/${id}`);
export const createLesson = (data) => api("/lessons", { method: "POST", body: data });
export const updateLesson = (id, data) => api(`/lessons/${id}`, { method: "PUT", body: data });
export const deleteLesson = (id) => api(`/lessons/${id}`, { method: "DELETE" });

export const listMaterials = (classId) => api(`/materials?classId=${classId}`);
export const createMaterial = (data) => api("/materials", { method: "POST", body: data });
export const deleteMaterial = (id) => api(`/materials/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------ assessments */
export const listAssignments = (classId) => api(`/assignments?classId=${classId}`);
export const getAssignment = (id) => api(`/assignments/${id}`);
export const createAssignment = (data) => api("/assignments", { method: "POST", body: data });
export const updateAssignment = (id, data) =>
  api(`/assignments/${id}`, { method: "PUT", body: data });
export const deleteAssignment = (id) => api(`/assignments/${id}`, { method: "DELETE" });
export const getAssignmentSubmissions = (id) => api(`/assignments/${id}/submissions`);
export const submitAssignment = (id, data) =>
  api(`/assignments/${id}/submit`, { method: "POST", body: data });

export const listSubmissions = (params = {}) => api(`/submissions${qs(params)}`);
export const gradeSubmission = (id, data) =>
  api(`/submissions/${id}/grade`, { method: "PUT", body: data });

export const listQuizzes = (classId) => api(`/quizzes?classId=${classId}`);
export const getQuiz = (id) => api(`/quizzes/${id}`);
export const createQuiz = (data) => api("/quizzes", { method: "POST", body: data });
export const updateQuiz = (id, data) => api(`/quizzes/${id}`, { method: "PUT", body: data });
export const deleteQuiz = (id) => api(`/quizzes/${id}`, { method: "DELETE" });
export const submitQuizAttempt = (id, answers) =>
  api(`/quizzes/${id}/attempt`, { method: "POST", body: { answers } });
export const listQuizAttempts = (id) => api(`/quizzes/${id}/attempts`);

/* ----------------------------------------------------------- announcements */
export const listAnnouncements = (params = {}) => api(`/announcements${qs(params)}`);
export const createAnnouncement = (data) => api("/announcements", { method: "POST", body: data });
export const updateAnnouncement = (id, data) =>
  api(`/announcements/${id}`, { method: "PUT", body: data });
export const deleteAnnouncement = (id) => api(`/announcements/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------ stats/grades */
export const getStats = () => api("/stats");
export const getMyGrades = () => api("/grades/me");
export const getClassGradebook = (classId) => api(`/grades/class/${classId}`);

/* ------------------------------------------------------------------ misc */
function qs(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const str = search.toString();
  return str ? `?${str}` : "";
}

/** Converts a File into a data URL (small files only, enforced server-side). */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function isPast(value) {
  if (!value) return false;
  return new Date(value) < new Date();
}

export function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
