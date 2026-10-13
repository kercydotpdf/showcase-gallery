import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  ClipboardList,
  Star,
  CalendarDays,
  Megaphone,
} from "lucide-react";
import { Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Table, THead, TBody, Td, Tr } from "../../components/ui/Table";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import ClassHeader from "../../components/classroom/ClassHeader";
import ClassTabs from "../../components/classroom/ClassTabs";
import ModulesPanel from "../../components/classroom/ModulesPanel";
import MaterialsPanel from "../../components/classroom/MaterialsPanel";
import AssignmentsPanel from "../../components/classroom/AssignmentsPanel";
import QuizzesPanel from "../../components/classroom/QuizzesPanel";
import AnnouncementsPanel from "../../components/classroom/AnnouncementsPanel";
import useAsync from "../../hooks/useAsync";
import * as api from "../../api";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "students", label: "Students" },
  { key: "modules", label: "Modules" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "quizzes", label: "Quizzes" },
  { key: "announcements", label: "Announcements" },
  { key: "grades", label: "Grades" },
];

export default function TeacherClassDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");

  const { data: cls, loading, error, reload } = useAsync(() => api.getClass(id), [id]);

  if (loading) return <Loading label="Loading class…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!cls) return null;

  return (
    <>
      <ClassHeader
        backTo="/teacher/classes"
        backLabel="Back to my classes"
        cls={cls}
        extra={
          <Link
            to="/teacher/announcements"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            <Megaphone className="h-4 w-4" />
            All announcements
          </Link>
        }
      />

      <ClassTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <Overview cls={cls} />}
      {tab === "students" && <Students cls={cls} />}
      {tab === "modules" && <ModulesPanel classId={id} canEdit />}
      {tab === "materials" && <MaterialsPanel classId={id} canEdit />}
      {tab === "assignments" && <AssignmentsPanel classId={id} canEdit />}
      {tab === "quizzes" && <QuizzesPanel classId={id} canEdit />}
      {tab === "announcements" && <AnnouncementsPanel classId={id} canEdit />}
      {tab === "grades" && <Gradebook classId={id} />}
    </>
  );
}

function Overview({ cls }) {
  const { data } = useAsync(() => api.getClassGradebook(cls._id), [cls._id]);
  const { data: materials } = useAsync(() => api.listMaterials(cls._id), [cls._id]);

  const pending = (data?.rows || []).reduce(
    (sum, r) => sum + r.assignmentCells.filter((c) => c.status === "submitted").length,
    0
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Enrolled students" value={cls.students?.length || 0} tone="blue" />
        <StatCard icon={ClipboardList} label="Awaiting grading" value={pending} tone="amber" />
        <StatCard icon={CalendarDays} label="Schedule" value={cls.schedule || "—"} tone="emerald" />
        <StatCard
          icon={Megaphone}
          label="Learning materials"
          value={materials?.length || 0}
          tone="violet"
        />
      </div>

      <Card className="mt-6">
        <CardHeader title="Class information" />
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {cls.subject ? `${cls.subject.code} — ${cls.subject.title}` : "Not linked"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Teacher</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.teacher?.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.schedule || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Students</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.students?.length || 0} enrolled</dd>
          </div>
          {cls.subject?.description && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Description
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                {cls.subject.description}
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </>
  );
}

function Students({ cls }) {
  return (
    <Card>
      <CardHeader
        title="Class roster"
        subtitle="Enrolment is managed by the administrator."
      />
      <Table>
        <THead
          columns={[
            { key: "name", label: "Student" },
            { key: "email", label: "Email" },
            { key: "no", label: "Student No." },
            { key: "status", label: "Status", width: "110px" },
          ]}
        />
        <TBody
          rows={cls.students || []}
          columns={4}
          empty="No students enrolled yet. Ask the administrator to enrol students."
          renderRow={(student) => (
            <Tr key={student._id}>
              <Td>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800">{student.name}</span>
                </div>
              </Td>
              <Td>{student.email}</Td>
              <Td>{student.studentNo || "—"}</Td>
              <Td>
                <Badge tone={student.active ? "green" : "rose"}>
                  {student.active ? "Active" : "Inactive"}
                </Badge>
              </Td>
            </Tr>
          )}
        />
      </Table>
    </Card>
  );
}

function Gradebook({ classId }) {
  const { data, loading, error, reload } = useAsync(
    () => api.getClassGradebook(classId),
    [classId]
  );

  if (loading) return <Loading label="Loading grades…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!data) return null;

  const columns = [
    { key: "student", label: "Student" },
    ...data.assignments.map((a) => ({ key: `a-${a._id}`, label: a.title })),
    ...data.quizzes.map((q) => ({ key: `q-${q._id}`, label: q.title })),
    { key: "total", label: "Total", width: "100px" },
  ];

  if (data.assignments.length === 0 && data.quizzes.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="Nothing to grade yet"
        hint="Create an assignment or a quiz and student scores will appear here."
      />
    );
  }

  return (
    <Card>
      <CardHeader title="Gradebook" subtitle="Scores across every assignment and quiz in this class" />
      <Table>
        <THead columns={columns} />
        <TBody
          rows={data.rows}
          columns={columns.length}
          empty="No students enrolled yet."
          renderRow={(row) => (
            <Tr key={row.student._id}>
              <Td>
                <span className="font-medium text-slate-800">{row.student.name}</span>
              </Td>
              {row.assignmentCells.map((cell) => (
                <Td key={cell.assignmentId}>
                  {cell.grade !== null ? (
                    <span className="font-medium text-slate-700">{cell.grade}</span>
                  ) : cell.status === "submitted" ? (
                    <Badge tone="amber">to grade</Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
              ))}
              {row.quizCells.map((cell) => (
                <Td key={cell.quizId}>
                  {cell.grade !== null ? (
                    <span className="font-medium text-slate-700">{cell.grade}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
              ))}
              <Td>
                <span className="font-semibold text-slate-900">
                  {row.earned}/{row.possible}
                </span>
                <span className="ml-1 text-xs text-slate-400">{row.percentage}%</span>
              </Td>
            </Tr>
          )}
        />
      </Table>
    </Card>
  );
}
