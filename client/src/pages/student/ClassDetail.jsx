import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Megaphone, ClipboardList, HelpCircle } from "lucide-react";
import { Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState } from "../../components/ui/Feedback";
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
  { key: "modules", label: "Modules" },
  { key: "materials", label: "Materials" },
  { key: "assignments", label: "Assignments" },
  { key: "quizzes", label: "Quizzes" },
  { key: "announcements", label: "Announcements" },
];

export default function StudentClassDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview");

  const { data: cls, loading, error, reload } = useAsync(() => api.getClass(id), [id]);

  if (loading) return <Loading label="Loading class…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!cls) return null;

  return (
    <>
      <ClassHeader
        backTo="/student/classes"
        backLabel="Back to my classes"
        cls={cls}
        extra={
          <Link
            to="/student/announcements"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white"
          >
            <Megaphone className="h-4 w-4" />
            Announcements
          </Link>
        }
      />

      <ClassTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && <Overview classId={id} cls={cls} />}
      {tab === "modules" && <ModulesPanel classId={id} />}
      {tab === "materials" && <MaterialsPanel classId={id} />}
      {tab === "assignments" && <AssignmentsPanel classId={id} />}
      {tab === "quizzes" && <QuizzesPanel classId={id} />}
      {tab === "announcements" && <AnnouncementsPanel classId={id} />}
    </>
  );
}

function Overview({ classId, cls }) {
  const { data: assignments } = useAsync(() => api.listAssignments(classId), [classId]);
  const { data: quizzes } = useAsync(() => api.listQuizzes(classId), [classId]);

  const list = assignments || [];
  const todo = list.filter(
    (a) => !a.mySubmission || (a.mySubmission.status !== "graded" && !a.mySubmission.grade)
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Assignments" value={list.length} tone="blue" />
        <StatCard icon={HelpCircle} label="To submit" value={todo.length} tone="amber" />
        <StatCard icon={Megaphone} label="Quizzes" value={(quizzes || []).length} tone="emerald" />
      </div>

      <Card className="mt-6">
        <CardHeader title="About this class" />
        <dl className="grid gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Teacher</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.teacher?.name || "Not assigned"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Schedule</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.schedule || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Classmates</dt>
            <dd className="mt-1 text-sm text-slate-700">{cls.students?.length || 0} enrolled</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</dt>
            <dd className="mt-1 text-sm text-slate-700">
              {cls.subject ? `${cls.subject.code} — ${cls.subject.title}` : "—"}
            </dd>
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

      <Card className="mt-6">
        <CardHeader title="Next up" />
        {list.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No assignments yet"
            hint="Check the Assignments tab for your work."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {list.slice(0, 5).map((a) => (
              <li key={a._id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-400">
                    {a.dueDate ? `Due ${a.dueDate.slice(0, 10)}` : "No deadline"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{a.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
