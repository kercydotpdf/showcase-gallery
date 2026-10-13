import { Link } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Star,
  ArrowRight,
  Megaphone,
  CalendarDays,
} from "lucide-react";
import { PageHeader, Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function Dashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => api.getStats(), []);

  if (loading) return <Loading label="Loading dashboard…" />;
  const counts = stats?.counts || {};

  return (
    <>
      <PageHeader
        title="Student dashboard"
        subtitle="Your classes, pending work and recent results."
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="My classes" value={counts.classes ?? 0} tone="blue" />
        <StatCard icon={ClipboardList} label="To submit" value={counts.pending ?? 0} tone="amber" />
        <StatCard icon={Star} label="Graded work" value={counts.graded ?? 0} tone="emerald" />
        <StatCard icon={Star} label="Submissions" value={counts.submitted ?? 0} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Pending assignments"
              action={
                <Link
                  to="/student/assignments"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.pendingAssignments?.length ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Nothing due right now"
                  hint="New assignments appear here as soon as your teacher posts them."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.pendingAssignments.map((a) => (
                    <li key={a._id} className="px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                          <p className="text-xs text-slate-400">
                            {a.dueDate ? `Due ${formatDate(a.dueDate, true)}` : "No deadline"}
                          </p>
                        </div>
                        <Badge tone={a.dueDate && new Date(a.dueDate) < new Date() ? "rose" : "amber"}>
                          {a.points} pts
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Recent results"
              action={
                <Link
                  to="/student/grades"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  Grades <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.recentGrades?.length ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No graded work yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.recentGrades.map((s) => (
                    <li key={s._id} className="flex items-center justify-between px-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {s.assignment?.title || "Assignment"}
                        </p>
                        <p className="text-xs text-slate-400">
                          Graded {formatDate(s.submittedAt, true)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600">{s.grade}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="My classes"
              action={
                <Link
                  to="/student/classes"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  All classes <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.classes?.length ? (
                <EmptyState
                  icon={BookOpen}
                  title="No classes yet"
                  hint="You are not enrolled in any class."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.classes.map((cls) => (
                    <li key={cls._id}>
                      <Link
                        to={`/student/classes/${cls._id}`}
                        className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{cls.name}</p>
                          <p className="truncate text-xs text-slate-400">
                            {cls.subject?.code || "No subject"}
                            {cls.teacher ? ` · ${cls.teacher}` : ""}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Announcements"
              action={
                <Link
                  to="/student/announcements"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.recentAnnouncements?.length ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No announcements yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.recentAnnouncements.map((a) => (
                    <li key={a._id} className="px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                          <p className="text-xs text-slate-400">{a.class?.name}</p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          <CalendarDays className="inline h-3 w-3" />{" "}
                          {formatDate(a.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <Link to="/student/assignments" className="text-sm font-medium text-sage hover:underline">
                Submit an assignment
              </Link>
              <Link to="/student/announcements" className="ml-4 inline-flex items-center gap-1 text-sm font-medium text-sage hover:underline">
                <Megaphone className="h-4 w-4" /> Announcements
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
