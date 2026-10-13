import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, User2, Users, BookOpen } from "lucide-react";
import { Badge } from "../ui/Feedback";

export default function ClassHeader({ backTo, backLabel, cls, extra }) {
  if (!cls) return null;

  return (
    <>
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {cls.name}
            </h1>
            {cls.subject && <Badge tone="blue">{cls.subject.code}</Badge>}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {cls.subject?.title || "No subject linked"}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" />
              {cls.teacher ? cls.teacher.name : "No teacher assigned"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {cls.students?.length || 0} enrolled
            </span>
            {cls.schedule && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {cls.schedule}
              </span>
            )}
            {!cls.subject && (
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Subject missing
              </span>
            )}
          </div>
        </div>

        {extra}
      </div>
    </>
  );
}
