import { Link } from "react-router-dom";
import { Star, BookOpen, ArrowRight } from "lucide-react";
import { PageHeader, Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Table, THead, TBody, Td, Tr } from "../../components/ui/Table";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function Grades() {
  const { data, loading, error, reload } = useAsync(() => api.getMyGrades(), []);

  if (loading) return <Loading label="Loading grades…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!data) return null;

  const { summary, classes } = data;

  if (summary.total === 0) {
    return (
      <>
        <PageHeader title="My grades" subtitle="Every score from your assignments and quizzes." />
        <EmptyState
          icon={Star}
          title="No graded work yet"
          hint="Once a teacher grades your work, your scores show up here."
          action={
            <Link to="/student/classes" className="mt-4 inline-block">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-sage hover:underline">
                Open my classes <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="My grades" subtitle="Every score from your assignments and quizzes." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Star}
          label="Overall"
          value={summary.percentage === null ? "—" : `${summary.percentage}%`}
          tone={summary.percentage >= 60 ? "emerald" : "amber"}
          hint={summary.earned !== undefined ? `${summary.earned} / ${summary.possible} pts` : ""}
        />
        <StatCard icon={BookOpen} label="Graded items" value={`${summary.graded}`} tone="blue" hint={`${summary.total} total`} />
        <StatCard icon={Star} label="Classes" value={classes.length} tone="violet" />
      </div>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader title="Assignments" />
          <Table>
            <THead
              columns={[
                { key: "title", label: "Assignment" },
                { key: "class", label: "Class" },
                { key: "submitted", label: "Submitted", width: "170px" },
                { key: "status", label: "Status", width: "130px" },
                { key: "score", label: "Score", width: "120px" },
              ]}
            />
            <TBody
              rows={data.assignmentRows}
              columns={5}
              empty="No assignments yet."
              renderRow={(r) => (
                <Tr key={r.assignment._id}>
                  <Td>
                    <p className="font-medium text-slate-800">{r.assignment.title}</p>
                    {r.feedback && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{r.feedback}</p>
                    )}
                  </Td>
                  <Td>{r.className}</Td>
                  <Td>{r.submittedAt ? formatDate(r.submittedAt, true) : "—"}</Td>
                  <Td>
                    <Badge
                      tone={
                        r.status === "graded"
                          ? "green"
                          : r.status === "submitted"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {r.status}
                    </Badge>
                  </Td>
                  <Td>
                    {r.grade === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {r.grade}/{r.points}
                      </span>
                    )}
                  </Td>
                </Tr>
              )}
            />
          </Table>
        </Card>

        <Card>
          <CardHeader title="Quizzes" />
          <Table>
            <THead
              columns={[
                { key: "quiz", label: "Quiz" },
                { key: "class", label: "Class" },
                { key: "taken", label: "Taken", width: "170px" },
                { key: "status", label: "Status", width: "130px" },
                { key: "score", label: "Score", width: "120px" },
              ]}
            />
            <TBody
              rows={data.quizRows}
              columns={5}
              empty="No quizzes yet."
              renderRow={(r) => (
                <Tr key={r.quiz._id}>
                  <Td className="font-medium text-slate-800">{r.quiz.title}</Td>
                  <Td>{r.className}</Td>
                  <Td>{r.takenAt ? formatDate(r.takenAt, true) : "—"}</Td>
                  <Td>
                    <Badge tone={r.status === "completed" ? "green" : "slate"}>{r.status}</Badge>
                  </Td>
                  <Td>
                    {r.grade === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {r.grade}/{r.points}
                      </span>
                    )}
                  </Td>
                </Tr>
              )}
            />
          </Table>
        </Card>
      </div>
    </>
  );
}
