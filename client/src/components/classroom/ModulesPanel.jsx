import { useState } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Loading, EmptyState, ErrorAlert } from "../ui/Feedback";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Confirm from "../ui/Confirm";
import { Field, Input, Textarea, FormError } from "../ui/Form";
import { useToast } from "../ui/Toast";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function ModulesPanel({ classId, canEdit }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState({});
  const [moduleForm, setModuleForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [reading, setReading] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listModules(classId),
    [classId]
  );
  const modules = data || [];

  function toggle(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function openLesson(lesson) {
    try {
      const full = await api.getLesson(lesson._id);
      setReading(full);
    } catch (err) {
      toast.error(err.message);
    }
  }

  /* ---------------------------------------------------------- modules */
  async function saveModule(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (moduleForm._id) {
        await api.updateModule(moduleForm._id, {
          title: moduleForm.title,
          description: moduleForm.description,
        });
        toast.success("Module updated");
      } else {
        await api.createModule({
          title: moduleForm.title,
          description: moduleForm.description,
          classId,
        });
        toast.success("Module created");
      }
      setModuleForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveLesson(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (lessonForm._id) {
        await api.updateLesson(lessonForm._id, {
          title: lessonForm.title,
          content: lessonForm.content,
        });
        toast.success("Lesson updated");
      } else {
        await api.createLesson({
          title: lessonForm.title,
          content: lessonForm.content,
          moduleId: lessonForm.moduleId,
          classId,
        });
        toast.success("Lesson created");
      }
      setLessonForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteModule(module) {
    await api.deleteModule(module._id);
    toast.success("Module deleted");
    await reload();
  }

  async function deleteLesson(lesson) {
    await api.deleteLesson(lesson._id);
    toast.success("Lesson deleted");
    await reload();
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Learning modules"
          subtitle={
            canEdit
              ? "Organise the course into modules and lessons"
              : "Open a module to read its lessons"
          }
          action={
            canEdit ? (
              <Button
                size="sm"
                onClick={() => {
                  setModuleForm({ title: "", description: "" });
                  setErrors("");
                }}
              >
                <Plus className="h-4 w-4" /> Add module
              </Button>
            ) : null
          }
        />

        <ErrorAlert>{error}</ErrorAlert>

        {loading ? (
          <Loading />
        ) : modules.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={BookOpen}
              title="No modules yet"
              hint={
                canEdit
                  ? "Create the first module, then add lessons inside it."
                  : "The teacher has not published any modules yet."
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {modules.map((m, index) => (
              <li key={m._id}>
                <div className="flex items-start gap-3 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => toggle(m._id)}
                    className="mt-0.5 rounded-md p-1 text-slate-400 hover:bg-slate-100"
                    aria-label="Toggle module"
                  >
                    {expanded[m._id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                    </div>
                    {m.description && (
                      <p className="mt-1 text-sm text-slate-500">{m.description}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {(m.lessons || []).length} lesson{(m.lessons || []).length === 1 ? "" : "s"}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModuleForm({ ...m, description: m.description || "" });
                          setErrors("");
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sage"
                        title="Edit module"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            title: "Delete module?",
                            message: `“${m.title}” and all of its lessons will be removed.`,
                            action: () => deleteModule(m),
                          })
                        }
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        title="Delete module"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {expanded[m._id] && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                    {(m.lessons || []).length === 0 ? (
                      <p className="py-2 text-sm text-slate-400">No lessons in this module yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {m.lessons.map((lesson, i) => (
                          <li
                            key={lesson._id}
                            className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200"
                          >
                            <span className="text-xs font-medium text-slate-400">
                              {i + 1}.
                            </span>
                            <button
                              type="button"
                              onClick={() => openLesson(lesson)}
                              className="flex-1 text-left text-sm font-medium text-slate-700 hover:text-sage"
                            >
                              {lesson.title}
                            </button>
                            {canEdit && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLessonForm({ ...lesson, moduleId: m._id });
                                    setErrors("");
                                  }}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-sage"
                                  title="Edit lesson"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirm({
                                      title: "Delete lesson?",
                                      message: `“${lesson.title}” will be removed.`,
                                      action: () => deleteLesson(lesson),
                                    })
                                  }
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                                  title="Delete lesson"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {canEdit && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-3"
                        onClick={() => {
                          setLessonForm({ title: "", content: "", moduleId: m._id });
                          setErrors("");
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add lesson
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Module form */}
      <Modal
        open={Boolean(moduleForm)}
        onClose={() => setModuleForm(null)}
        title={moduleForm?._id ? "Edit module" : "Create module"}
      >
        {moduleForm && (
          <form onSubmit={saveModule} className="space-y-4">
            <FormError>{errors}</FormError>
            <Field label="Module title" required>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Module 1 — Introduction"
                required
              />
            </Field>
            <Field label="Description">
              <Textarea
                rows={3}
                value={moduleForm.description || ""}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="What does this module cover?"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setModuleForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {moduleForm._id ? "Save changes" : "Create module"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Lesson form */}
      <Modal
        open={Boolean(lessonForm)}
        onClose={() => setLessonForm(null)}
        title={lessonForm?._id ? "Edit lesson" : "Add lesson"}
        width="max-w-2xl"
      >
        {lessonForm && (
          <form onSubmit={saveLesson} className="space-y-4">
            <FormError>{errors}</FormError>
            <Field label="Lesson title" required>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                placeholder="What is Information Technology?"
                required
              />
            </Field>
            <Field label="Lesson content" hint="Plain text. Students read this in the classroom view.">
              <Textarea
                rows={12}
                value={lessonForm.content || ""}
                onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                placeholder="Write the lesson content here…"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setLessonForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {lessonForm._id ? "Save changes" : "Add lesson"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Lesson reader */}
      <Modal
        open={Boolean(reading)}
        onClose={() => setReading(null)}
        title={reading?.title}
        subtitle={reading ? `Last updated ${formatDate(reading.updatedAt, true)}` : ""}
        width="max-w-2xl"
      >
        {reading && (
          <div>
            {reading.content ? (
              <article className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {reading.content}
              </article>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-500">
                <FileText className="h-4 w-4" />
                This lesson has no written content yet.
              </div>
            )}
          </div>
        )}
      </Modal>

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
