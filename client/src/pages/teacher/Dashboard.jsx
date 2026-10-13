import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight, Users, Megaphone } from "lucide-react";
import { PageHeader, Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import Button from "../../components/ui/Button";
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
        title="Teacher dashboard"
        subtitle="Your assigned classes, pending grading and upcoming deadlines."
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="My classes" value={counts.classes ?? 0} tone="blue" />
        <StatCard icon={Users} label="Students" value={counts.students ?? 0} tone="emerald" />
        <StatCard
          icon={Megaphone}
          label="Awaiting grading"
          value={counts.pendingGrades ?? 0}
          tone="amber"
          hint="Submitted work not yet scored"
        />
        <StatCard
          icon={Megaphone}
          label="Assignments"
          value={counts.assignments ?? 0}
          tone="violet"
          hint={`${counts.quizzes ?? 0} quizzes`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="My classes"
            action={
              <Link
                to="/teacher/classes"
                className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="p-2">
            {!stats?.classes?.length ? (
              <EmptyState
                icon={CalendarDays}
                title="No classes assigned yet"
                hint="Ask an administrator to assign a class to you."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.classes.slice(0, 6).map((cls) => (
                  <li key={cls._id}>
                    <Link
                      to={`/teacher/classes/${cls._id}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{cls.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {cls.subject ? `${cls.subject.code} · ${cls.subject.title}` : "No subject"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone="blue">{cls.students} students</Badge>
                        <ArrowRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Upcoming deadlines"
              action={
                <span className="text-xs text-slate-400">
                  {stats?.upcoming?.length || 0} upcoming
                </span>
              }
            />
            <div className="p-2">
              {!stats?.upcoming?.length ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No assignments with future deadlines.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.upcoming.map((a) => (
                    <li key={a._id} className="px-3 py-3">
                      <p className="text-sm font-medium text-slate-800">{a.title}</p>
                      <p className="text-xs text-slate-400">
                        {a.class?.name} · due {formatDate(a.dueDate, true)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Quick actions" />
            <div className="flex flex-wrap gap-2 px-5 py-4">
              <Link to="/teacher/classes">
                <Button variant="secondary" size="sm">Open my classes</Button>
              </Link>
              <Link to="/teacher/announcements">
                <Button variant="secondary" size="sm">Post announcement</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
