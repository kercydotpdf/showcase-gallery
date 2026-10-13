import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { PageHeader, Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function Dashboard() {
  const { data: stats, loading, error, reload } = useAsync(() => api.getStats(), []);
  const { data: classes } = useAsync(() => api.listClasses(), []);

  if (loading) return <Loading label="Loading dashboard…" />;

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle="Overview of every account, subject and class in the school."
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={GraduationCap}
            label="Total students"
            value={stats.counts?.students ?? 0}
            tone="blue"
          />
          <StatCard icon={Users} label="Total teachers" value={stats.counts?.teachers ?? 0} tone="violet" />
          <StatCard icon={BookOpen} label="Total subjects" value={stats.counts?.subjects ?? 0} tone="emerald" />
          <StatCard icon={CalendarDays} label="Total classes" value={stats.counts?.classes ?? 0} tone="amber" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Academic overview */}
        <Card>
          <CardHeader
            title="Academic overview"
            subtitle="Classes, teachers and enrolment"
            action={
              <Link
                to="/admin/classes"
                className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
              >
                Manage <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="p-2">
            {(classes || []).length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No classes yet"
                hint="Create a subject, then open a class section for it."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {(classes || []).slice(0, 6).map((cls) => (
                  <li key={cls._id}>
                    <Link
                      to={`/admin/classes/${cls._id}`}
                      className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{cls.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          {cls.subject ? `${cls.subject.code} · ` : ""}
                          {cls.teacher ? cls.teacher.name : "No teacher assigned"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge tone="blue">{cls.students?.length || 0} students</Badge>
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
          {/* Recent accounts */}
          <Card>
            <CardHeader
              title="Recently added accounts"
              action={
                <Link
                  to="/admin/students"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.recentUsers?.length ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No accounts yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.recentUsers.map((u) => (
                    <li key={u._id} className="flex items-center justify-between px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{u.name}</p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={u.role === "admin" ? "violet" : u.role === "teacher" ? "blue" : "green"}>
                          {u.role}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Recent announcements */}
          <Card>
            <CardHeader
              title="Latest announcements"
              action={
                <Link
                  to="/admin/announcements"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sage hover:text-sage-dark"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="p-2">
              {!stats?.recentAnnouncements?.length ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No announcements posted yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {stats.recentAnnouncements.map((a) => (
                    <li key={a._id} className="flex items-start gap-3 px-3 py-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                        <Megaphone className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                        <p className="text-xs text-slate-400">
                          {a.class?.name ? `${a.class.name} · ` : ""}
                          {formatDate(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
