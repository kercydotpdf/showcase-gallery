import { useEffect, useState } from "react";
import SubmitModal from "./SubmitModal";
import { ClipboardList, Plus, Pencil, Trash2, Clock, Send, Star } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Loading, EmptyState, ErrorAlert, Badge } from "../ui/Feedback";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Confirm from "../ui/Confirm";
import { Field, Input, Textarea, FormError } from "../ui/Form";
import { useToast } from "../ui/Toast";
import useAsync from "../../hooks/useAsync";
import { formatDate, isPast } from "../../api";
import * as api from "../../api";

const EMPTY = { title: "", instructions: "", dueDate: "", points: 100 };

export default function AssignmentsPanel({ classId, canEdit }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [submitFor, setSubmitFor] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listAssignments(classId),
    [classId]
  );
  const assignments = data || [];

  /* ------------------------------------------------------- teacher CRUD */
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      const payload = {
        title: form.title,
        instructions: form.instructions,
        dueDate: form.dueDate || null,
        points: Number(form.points) || 0,
      };
      if (form._id) {
        await api.updateAssignment(form._id, payload);
        toast.success("Assignment updated");
      } else {
        await api.createAssignment({ ...payload, classId });
        toast.success("Assignment created");
      }
      setForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    await api.deleteAssignment(item._id);
    toast.success("Assignment deleted");
    await reload();
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Assignments"
          subtitle={canEdit ? "Written work with deadlines and point values" : "Work you need to submit"}
          action={
            canEdit ? (
              <Button
                size="sm"
                onClick={() => {
                  setForm({ ...EMPTY });
                  setErrors("");
                }}
              >
                <Plus className="h-4 w-4" /> Add assignment
              </Button>
            ) : null
          }
        />

        <ErrorAlert>{error}</ErrorAlert>

        {loading ? (
          <Loading />
        ) : assignments.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={ClipboardList}
              title="No assignments yet"
              hint={canEdit ? "Create the first assignment for this class." : undefined}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => {
              const sub = a.mySubmission;
              const overdue = a.dueDate && isPast(a.dueDate);
              return (
                <li key={a._id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                        <Badge tone="slate">{a.points} pts</Badge>
                        {canEdit && (
                          <Badge tone="blue">{a.submissionCount ?? 0} submitted</Badge>
                        )}
                        {sub && (
                          <Badge
                            tone={sub.status === "graded" ? "green" : "violet"}
                          >
                            {sub.status === "graded" ? `Graded: ${sub.grade}/${a.points}` : "Submitted"}
                          </Badge>
                        )}
                        {!sub && canEdit === false && (
                          <Badge tone={overdue ? "rose" : "amber"}>
                            {overdue ? "Overdue" : "Not submitted"}
                          </Badge>
                        )}
                      </div>

                      {a.instructions && (
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-sm text-slate-500">
                          {a.instructions}
                        </p>
                      )}

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {a.dueDate ? `Due ${formatDate(a.dueDate, true)}` : "No deadline"}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canEdit ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setReviewing(a)}>
                            Review submissions
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({
                                ...a,
                                dueDate: a.dueDate ? a.dueDate.slice(0, 10) : "",
                              });
                              setErrors("");
                            }}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sage"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirm({
                                title: "Delete assignment?",
                                message: `“${a.title}” and all student submissions will be removed.`,
                                action: () => remove(a),
                              })
                            }
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant={sub ? "secondary" : "primary"}
                          onClick={() => setSubmitFor(a)}
                        >
                          {sub ? "View / update" : "Submit work"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {sub && sub.feedback && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                      <span className="font-semibold">Teacher feedback:</span> {sub.feedback}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Teacher: create / edit */}
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit assignment" : "Create assignment"}
        width="max-w-xl"
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Chapter 1 Reflection"
                required
              />
            </Field>
            <Field label="Instructions">
              <Textarea
                rows={6}
                value={form.instructions || ""}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="What should students do?"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deadline">
                <Input
                  type="date"
                  value={form.dueDate || ""}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </Field>
              <Field label="Points" required>
                <Input
                  type="number"
                  min="0"
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {form._id ? "Save changes" : "Create assignment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <SubmitModal
        key={submitFor?._id}
        assignment={submitFor}
        onClose={() => setSubmitFor(null)}
        onSaved={async () => {
          setSubmitFor(null);
          await reload();
        }}
      />

      <ReviewModal key={reviewing?._id} assignment={reviewing} onClose={() => setReviewing(null)} />

      <Confirm
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.action}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------- teacher */
function ReviewModal({ assignment, onClose }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const assignmentId = assignment?._id;

  // Remounted with a key by the parent, so loading starts as true.
  useEffect(() => {
    if (!assignmentId) return undefined;
    let cancelled = false;
    api
      .getAssignmentSubmissions(assignmentId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
        const map = {};
        d.submissions.forEach((s) => {
          map[s._id] = { grade: s.grade ?? "", feedback: s.feedback || "" };
        });
        setDrafts(map);
        setErrors("");
      })
      .catch((e) => {
        if (!cancelled) setErrors(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  async function grade(submissionId) {
    const draft = drafts[submissionId] || {};
    if (draft.grade === "" || draft.grade === null) {
      toast.error("Enter a score before grading");
      return;
    }
    setBusyId(submissionId);
    try {
      await api.gradeSubmission(submissionId, {
        grade: Number(draft.grade),
        feedback: draft.feedback,
      });
      toast.success("Grade saved");
      const d = await api.getAssignmentSubmissions(assignment._id);
      setData(d);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!assignment) return null;

  return (
    <Modal open onClose={onClose} title={assignment.title} subtitle="Student submissions" width="max-w-3xl">
      {loading ? (
        <Loading label="Loading submissions…" />
      ) : errors ? (
        <FormError>{errors}</FormError>
      ) : !data ? null : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {data.submissions.length} of {data.submissions.length + data.missing.length} students
            have submitted.
          </p>

          {data.submissions.length === 0 && (
            <EmptyState icon={Send} title="No submissions yet" />
          )}

          {data.submissions.map((s) => {
            const draft = drafts[s._id] || {};
            return (
              <div key={s._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{s.student?.name}</p>
                    <p className="text-xs text-slate-400">
                      Submitted {formatDate(s.submittedAt, true)}
                    </p>
                  </div>
                  <Badge tone={s.status === "graded" ? "green" : "amber"}>
                    {s.status === "graded" ? `Graded ${s.grade}/${assignment.points}` : "Awaiting grade"}
                  </Badge>
                </div>

                {s.content && (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-slate-200">
                    {s.content}
                  </p>
                )}

                {s.file?.url && (
                  <a
                    href={s.file.url}
                    download={s.file.name}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sage hover:underline"
                  >
                    Download {s.file.name || "attachment"}
                  </a>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
                  <Field label="Score">
                    <Input
                      type="number"
                      min="0"
                      max={assignment.points}
                      value={draft.grade ?? ""}
                      onChange={(e) =>
                        setDrafts({ ...drafts, [s._id]: { ...draft, grade: e.target.value } })
                      }
                      placeholder={`/${assignment.points}`}
                    />
                  </Field>
                  <Field label="Feedback">
                    <Input
                      value={draft.feedback ?? ""}
                      onChange={(e) =>
                        setDrafts({ ...drafts, [s._id]: { ...draft, feedback: e.target.value } })
                      }
                      placeholder="Great work! …"
                    />
                  </Field>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    loading={busyId === s._id}
                    onClick={() => grade(s._id)}
                  >
                    <Star className="h-3.5 w-3.5" /> Save grade
                  </Button>
                </div>
              </div>
            );
          })}

          {data.missing.length > 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4">
              <p className="text-sm font-semibold text-slate-700">Not submitted yet</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.missing.map((m) => (
                  <li key={m.student._id}>
                    <Badge tone="slate">{m.student.name}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
