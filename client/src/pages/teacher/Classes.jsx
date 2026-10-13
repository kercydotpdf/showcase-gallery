import { useNavigate } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import useAsync from "../../hooks/useAsync";
import * as api from "../../api";

export default function Classes() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => api.listClasses(), []);
  const classes = data || [];

  return (
    <>
      <PageHeader
        title="My classes"
        subtitle="Classes assigned to you by the administrator."
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      {loading ? (
        <Loading />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={error ? "Could not load classes" : "No classes assigned yet"}
          hint={error ? undefined : "When an administrator assigns a class to you, it appears here."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((cls) => (
            <Card
              key={cls._id}
              className="group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => navigate(`/teacher/classes/${cls._id}`)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-sage">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-sage" />
                </div>

                <p className="mt-4 text-lg font-semibold text-slate-900">{cls.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {cls.subject ? cls.subject.title : "No subject linked"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {cls.subject && <Badge tone="blue">{cls.subject.code}</Badge>}
                  <Badge tone="slate">
                    {cls.students?.length || 0} student{(cls.students?.length || 0) === 1 ? "" : "s"}
                  </Badge>
                  {cls.schedule && <Badge tone="emerald">{cls.schedule}</Badge>}
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
