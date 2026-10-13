import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  Users,
  GripVertical,
} from "lucide-react";
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

const EMPTY = {
  title: "",
  instructions: "",
  dueDate: "",
  allowRetake: false,
  showResult: true,
  questions: [],
};

function blankQuestion() {
  return { question: "", options: ["", ""], correct: 0, points: 1 };
}

export default function QuizzesPanel({ classId, canEdit }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [attemptsFor, setAttemptsFor] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listQuizzes(classId),
    [classId]
  );
  const quizzes = data || [];

  function setQuestion(index, patch) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }

  function setOption(qIndex, oIndex, value) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q
      ),
    }));
  }

  function addOption(qIndex) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex && q.options.length < 5 ? { ...q, options: [...q.options, ""] } : q
      ),
    }));
  }

  function removeOption(qIndex, oIndex) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIndex || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oIndex);
        const correct = q.correct >= options.length ? options.length - 1 : q.correct;
        return { ...q, options, correct };
      }),
    }));
  }

  function validate(candidate) {
    if (!candidate.title.trim()) return "Give the quiz a title.";
    if (candidate.questions.length === 0) return "Add at least one question.";
    for (let i = 0; i < candidate.questions.length; i += 1) {
      const q = candidate.questions[i];
      if (!q.question.trim()) return `Question ${i + 1} needs text.`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1} has an empty option.`;
      if (q.correct < 0 || q.correct >= q.options.length) {
        return `Question ${i + 1} needs a correct answer selected.`;
      }
    }
    return null;
  }

  async function save(e) {
    e.preventDefault();
    const problem = validate(form);
    if (problem) {
      setErrors(problem);
      return;
    }
    setBusy(true);
    setErrors("");
    try {
      const payload = {
        title: form.title,
        instructions: form.instructions,
        dueDate: form.dueDate || null,
        allowRetake: form.allowRetake,
        showResult: form.showResult,
        questions: form.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct: Number(q.correct),
          points: Number(q.points) || 1,
        })),
      };
      if (form._id) {
        await api.updateQuiz(form._id, payload);
        toast.success("Quiz updated");
      } else {
        await api.createQuiz({ ...payload, classId });
        toast.success("Quiz created");
      }
      setForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(quiz) {
    await api.deleteQuiz(quiz._id);
    toast.success("Quiz deleted");
    await reload();
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Quizzes"
          subtitle={canEdit ? "Multiple-choice quizzes graded automatically" : "Take a quiz to receive your score"}
          action={
            canEdit ? (
              <Button
                size="sm"
                onClick={() => {
                  setForm({ ...EMPTY, questions: [blankQuestion()] });
                  setErrors("");
                }}
              >
                <Plus className="h-4 w-4" /> Add quiz
              </Button>
            ) : null
          }
        />

        <ErrorAlert>{error}</ErrorAlert>

        {loading ? (
          <Loading />
        ) : quizzes.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={HelpCircle}
              title="No quizzes yet"
              hint={canEdit ? "Create a multiple-choice quiz with automatic scoring." : undefined}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {quizzes.map((q) => {
              const total = (q.questions || []).reduce((s, x) => s + (Number(x.points) || 1), 0);
              const attempts = q.myAttempts || [];
              const best = attempts.reduce(
                (m, a) => (m === null || a.score > m ? a.score : m),
                null
              );
              const closed = !q.allowRetake && attempts.length > 0;

              return (
                <li key={q._id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{q.title}</p>
                        <Badge tone="slate">
                          {q.questions?.length || 0} question{(q.questions?.length || 0) === 1 ? "" : "s"}
                        </Badge>
                        <Badge tone="violet">{total} pts</Badge>
                        {canEdit ? (
                          <Badge tone="blue">{q.attemptCount ?? 0} attempts</Badge>
                        ) : attempts.length > 0 ? (
                          <Badge tone={best === total ? "green" : "amber"}>
                            Best: {best}/{total}
                          </Badge>
                        ) : null}
                      </div>

                      {q.instructions && (
                        <p className="mt-1.5 text-sm text-slate-500">{q.instructions}</p>
                      )}

                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {q.dueDate ? `Due ${formatDate(q.dueDate, true)}` : "No deadline"}
                          {q.dueDate && isPast(q.dueDate) && " (past)"}
                        </span>
                        {!canEdit && (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {q.allowRetake ? "Retakes allowed" : "One attempt only"}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {canEdit ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setAttemptsFor(q)}>
                            <Users className="h-4 w-4" /> Attempts
                          </Button>
                          <button
                            type="button"
                            onClick={() => {
                              setForm({ ...q, dueDate: q.dueDate ? q.dueDate.slice(0, 10) : "" });
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
                                title: "Delete quiz?",
                                message: `“${q.title}” and all student attempts will be removed.`,
                                action: () => remove(q),
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
                          disabled={closed}
                          onClick={() => navigate(`/student/quizzes/${q._id}`)}
                        >
                          {closed ? "Already taken" : attempts.length ? "Retake quiz" : "Take quiz"}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* --------------------------------------------------- quiz builder */}
      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit quiz" : "Create quiz"}
        subtitle="Multiple-choice questions are scored automatically."
        width="max-w-3xl"
      >
        {form && (
          <form onSubmit={save} className="space-y-5">
            <FormError>{errors}</FormError>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quiz title" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Introduction Quiz"
                  required
                />
              </Field>
              <Field label="Deadline">
                <Input
                  type="date"
                  value={form.dueDate || ""}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Instructions">
              <Textarea
                rows={2}
                value={form.instructions || ""}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="Choose the best answer for each question."
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.allowRetake}
                  onChange={(e) => setForm({ ...form, allowRetake: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sage focus:ring-sage"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-700">Allow retakes</span>
                  <span className="block text-xs text-slate-400">
                    Otherwise a student can only submit once.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.showResult}
                  onChange={(e) => setForm({ ...form, showResult: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sage focus:ring-sage"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-700">Show score instantly</span>
                  <span className="block text-xs text-slate-400">
                    Students see their result right after submitting.
                  </span>
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Questions ({form.questions.length})
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setForm({ ...form, questions: [...form.questions, blankQuestion()] })
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add question
                </Button>
              </div>

              {form.questions.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
                  No questions yet.
                </p>
              )}

              {form.questions.map((q, qi) => (
                <div key={qi} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <GripVertical className="h-3.5 w-3.5" /> Question {qi + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        Points
                        <input
                          type="number"
                          min="1"
                          value={q.points}
                          onChange={(e) => setQuestion(qi, { points: e.target.value })}
                          className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            questions: form.questions.filter((_, i) => i !== qi),
                          })
                        }
                        className="rounded p-1 text-slate-400 hover:bg-white hover:text-rose-600"
                        title="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Input
                    value={q.question}
                    onChange={(e) => setQuestion(qi, { question: e.target.value })}
                    placeholder="Type the question…"
                  />

                  <div className="mt-3 space-y-2">
                    {q.options.map((option, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={Number(q.correct) === oi}
                          onChange={() => setQuestion(qi, { correct: oi })}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          title="Mark as the correct answer"
                        />
                        <Input
                          value={option}
                          onChange={(e) => setOption(qi, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qi, oi)}
                            className="rounded p-1 text-slate-400 hover:text-rose-600"
                            title="Remove option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {q.options.length < 5 && (
                      <button
                        type="button"
                        onClick={() => addOption(qi)}
                        className="text-xs font-medium text-sage hover:underline"
                      >
                        + Add option
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Select the radio button next to the correct answer.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {form._id ? "Save changes" : "Create quiz"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <AttemptsModal key={attemptsFor?._id} quiz={attemptsFor} onClose={() => setAttemptsFor(null)} />

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

function AttemptsModal({ quiz, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState("");

  const quizId = quiz?._id;

  // Remounted with a key, so loading starts as true.
  useEffect(() => {
    if (!quizId) return undefined;
    let cancelled = false;
    api
      .listQuizAttempts(quizId)
      .then((d) => {
        if (cancelled) return;
        setData(d);
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
  }, [quizId]);

  if (!quiz) return null;
  const total = quiz.questions.reduce((s, x) => s + (Number(x.points) || 1), 0);

  return (
    <Modal open onClose={onClose} title={`${quiz.title} — attempts`} width="max-w-2xl">
      {loading ? (
        <Loading />
      ) : errors ? (
        <FormError>{errors}</FormError>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Users} title="No attempts yet" hint="Students have not taken this quiz." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((a) => (
            <li key={a._id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{a.student?.name}</p>
                <p className="text-xs text-slate-400">
                  Attempt {a.attempt} · {formatDate(a.takenAt, true)}
                </p>
              </div>
              <Badge tone={a.score === total ? "green" : a.score > 0 ? "amber" : "rose"}>
                {a.score} / {total}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
