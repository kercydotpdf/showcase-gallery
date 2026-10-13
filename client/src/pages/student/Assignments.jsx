import { useState } from "react";
import { ClipboardList, Send } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/Card";
import { Table, THead, TBody, Td, Tr } from "../../components/ui/Table";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import Button from "../../components/ui/Button";
import SubmitModal from "../../components/classroom/SubmitModal";
import useAsync from "../../hooks/useAsync";
import { formatDate, isPast } from "../../api";
import * as api from "../../api";

export default function Assignments() {
  const [submitFor, setSubmitFor] = useState(null);

  const { data, loading, error, reload } = useAsync(async () => {
    const classes = await api.listClasses();
    const grouped = await Promise.all(
      classes.map(async (cls) => {
        const list = await api.listAssignments(cls._id);
        return list.map((a) => ({ ...a, classRef: cls }));
      })
    );
    return grouped.flat().sort((a, b) => {
      const at = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bt = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return at - bt;
    });
  }, []);

  const rows = data || [];

  function statusOf(a) {
    const s = a.mySubmission;
    if (!s) return { label: "Not submitted", tone: "slate" };
    if (s.grade !== null && s.grade !== undefined) return { label: "Graded", tone: "green" };
    if (s.status === "submitted") return { label: "Submitted", tone: "amber" };
    return { label: s.status, tone: "slate" };
  }

  return (
    <>
      <PageHeader
        title="My assignments"
        subtitle="Work from every class you are enrolled in, soonest deadline first."
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      {loading ? (
        <Loading label="Loading assignments…" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          hint="Assignments posted by your teachers will appear here."
        />
      ) : (
        <Card>
          <Table>
            <THead
              columns={[
                { key: "title", label: "Assignment" },
                { key: "class", label: "Class" },
                { key: "due", label: "Due", width: "160px" },
                { key: "points", label: "Points", width: "90px" },
                { key: "status", label: "Status", width: "140px" },
                { key: "action", label: "", width: "150px" },
              ]}
            />
            <TBody
              rows={rows}
              columns={6}
              empty="No assignments yet."
              renderRow={(a) => {
                const st = statusOf(a);
                const overdue = a.dueDate && isPast(a.dueDate) && !a.mySubmission;
                return (
                  <Tr key={a._id}>
                    <Td>
                      <p className="font-medium text-slate-800">{a.title}</p>
                      {a.instructions && (
                        <p className="line-clamp-1 text-xs text-slate-400">{a.instructions}</p>
                      )}
                    </Td>
                    <Td>{a.classRef?.name}</Td>
                    <Td>
                      <span className={overdue ? "text-rose-600" : "text-slate-600"}>
                        {a.dueDate ? formatDate(a.dueDate, true) : "—"}
                      </span>
                      {overdue && <span className="ml-1 text-xs font-medium">overdue</span>}
                    </Td>
                    <Td>{a.points}</Td>
                    <Td>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {a.mySubmission?.grade !== null && a.mySubmission?.grade !== undefined && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          {a.mySubmission.grade}/{a.points}
                        </p>
                      )}
                    </Td>
                    <Td>
                      <Button size="sm" variant="secondary" onClick={() => setSubmitFor(a)}>
                        <Send className="h-3.5 w-3.5" />
                        {a.mySubmission ? "Update" : "Submit"}
                      </Button>
                    </Td>
                  </Tr>
                );
              }}
            />
          </Table>
        </Card>
      )}

      <SubmitModal
        key={submitFor?._id}
        assignment={submitFor}
        onClose={() => setSubmitFor(null)}
        onSaved={reload}
      />
    </>
  );
}
