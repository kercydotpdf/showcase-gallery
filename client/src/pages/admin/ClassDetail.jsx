import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, UserPlus, Users, CalendarDays, BookOpen } from "lucide-react";
import { PageHeader, Card, CardHeader, StatCard } from "../../components/ui/Card";
import { Table, THead, TBody, Td, Tr } from "../../components/ui/Table";
import { Loading, ErrorAlert, Badge } from "../../components/ui/Feedback";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Confirm from "../../components/ui/Confirm";
import { Field, Select, FormError } from "../../components/ui/Form";
import { useToast } from "../../components/ui/Toast";
import useAsync from "../../hooks/useAsync";
import * as api from "../../api";

export default function AdminClassDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: cls, loading, error, reload } = useAsync(() => api.getClass(id), [id]);
  const { data: students } = useAsync(() => api.listUsers({ role: "student", active: "true" }), []);

  if (loading) return <Loading label="Loading class…" />;
  if (error) return <ErrorAlert onRetry={reload}>{error}</ErrorAlert>;
  if (!cls) return null;

  const enrolledIds = new Set((cls.students || []).map((s) => String(s._id)));
  const candidates = (students || []).filter((s) => !enrolledIds.has(String(s._id)));

  async function enroll(e) {
    e.preventDefault();
    if (!selected) {
      setErrors("Choose a student to enroll.");
      return;
    }
    setBusy(true);
    setErrors("");
    try {
      await api.enrollStudent(id, selected);
      toast.success("Student enrolled");
      setAddOpen(false);
      setSelected("");
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function unenroll(student) {
    await api.unenrollStudent(id, student._id);
    toast.success(`${student.name} removed from the class`);
    await reload();
  }

  return (
    <>
      <Link
        to="/admin/classes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to classes
      </Link>

      <PageHeader
        title={cls.name}
        subtitle={
          cls.subject ? `${cls.subject.code} — ${cls.subject.title}` : "No subject linked"
        }
        actions={
          <Button onClick={() => setAddOpen(true)} disabled={candidates.length === 0}>
            <UserPlus className="h-4 w-4" />
            Enroll student
          </Button>
        }
      />

      <ErrorAlert>{errors}</ErrorAlert>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Enrolled students" value={cls.students?.length || 0} tone="blue" />
        <StatCard icon={BookOpen} label="Subject" value={cls.subject?.code || "—"} tone="violet" />
        <StatCard
          icon={CalendarDays}
          label="Schedule"
          value={cls.schedule || "—"}
          tone="emerald"
          hint="Class schedule"
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Class roster"
          subtitle={cls.teacher ? `Adviser: ${cls.teacher.name}` : "No teacher assigned yet"}
        />
        <Table>
          <THead
            columns={[
              { key: "name", label: "Student" },
              { key: "email", label: "Email" },
              { key: "no", label: "Student No." },
              { key: "status", label: "Status", width: "110px" },
              { key: "actions", label: "", width: "90px" },
            ]}
          />
          <TBody
            rows={cls.students || []}
            columns={5}
            empty="No students enrolled yet."
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
                <Td>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          title: `Remove ${student.name}?`,
                          message: "The student keeps their account but loses access to this class.",
                          action: () => unenroll(student),
                        })
                      }
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      title="Remove from class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            )}
          />
        </Table>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Enroll a student"
        subtitle={`Add a student to ${cls.name}.`}
        width="max-w-md"
      >
        <form onSubmit={enroll} className="space-y-4">
          <FormError>{errors}</FormError>
          <Field label="Student" required>
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">Select a student…</option>
              {candidates.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.studentNo ? `(${s.studentNo})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          {candidates.length === 0 && (
            <p className="text-sm text-slate-500">
              Every active student is already enrolled in this class.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={busy} disabled={candidates.length === 0}>
              Enroll
            </Button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel="Remove"
        onConfirm={confirm?.action}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
