import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, User2 } from "lucide-react";
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
      <PageHeader title="My classes" subtitle="Everything you are enrolled in." />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      {loading ? (
        <Loading />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          hint="You are not enrolled in any class. Ask your administrator."
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
                onClick={() => navigate(`/student/classes/${cls._id}`)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mist text-sage">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-sage" />
                </div>

                <p className="mt-4 text-lg font-semibold text-slate-900">{cls.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {cls.subject ? cls.subject.title : "No subject linked"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {cls.subject && <Badge tone="blue">{cls.subject.code}</Badge>}
                  {cls.teacher && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <User2 className="h-3.5 w-3.5" /> {cls.teacher.name}
                    </span>
                  )}
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
