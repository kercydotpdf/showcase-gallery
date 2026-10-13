import { useState } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/Card";
import { Loading, EmptyState, ErrorAlert } from "../../components/ui/Feedback";
import SearchInput from "../../components/ui/SearchInput";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Confirm from "../../components/ui/Confirm";
import { Field, Input, Textarea, FormError } from "../../components/ui/Form";
import { useToast } from "../../components/ui/Toast";
import useAsync from "../../hooks/useAsync";
import * as api from "../../api";

const EMPTY = { code: "", title: "", description: "" };

export default function Subjects() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listSubjects({ search }),
    [search]
  );
  const subjects = data || [];

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (form._id) {
        await api.updateSubject(form._id, form);
        toast.success("Subject updated");
      } else {
        await api.createSubject(form);
        toast.success("Subject created");
      }
      setForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(subject) {
    await api.deleteSubject(subject._id);
    toast.success("Subject deleted");
    await reload();
  }

  return (
    <>
      <PageHeader
        title="Subjects"
        subtitle="The course catalogue offered by the school."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search subjects…" />
            <Button onClick={() => { setForm({ ...EMPTY }); setErrors(""); }}>+ Add subject</Button>
          </>
        }
      />

      <ErrorAlert>{error}</ErrorAlert>

      <div className="mt-3">
        {loading ? (
          <Loading />
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={error ? "Could not load subjects" : "No subjects yet"}
            hint={error ? undefined : "Create the first subject, then build classes from it."}
            action={
              error ? undefined : (
                <Button onClick={() => { setForm({ ...EMPTY }); setErrors(""); }}>
                  Add subject
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <Card key={s._id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mist text-sage">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => { setForm({ ...s }); setErrors(""); }}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sage"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({
                          title: `Delete ${s.code}?`,
                          message:
                            "Subjects that are still used by a class cannot be deleted. Remove those classes first.",
                          action: () => remove(s),
                        })
                      }
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-sage">
                  {s.code}
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {s.description || "No description provided."}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit subject" : "Add subject"}
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>
            <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
              <Field label="Code" required>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="INF232"
                  required
                />
              </Field>
              <Field label="Title" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Fundamentals of Information Technology"
                  required
                />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                rows={4}
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this subject about?"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {form._id ? "Save changes" : "Create subject"}
              </Button>
            </div>
          </form>
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
