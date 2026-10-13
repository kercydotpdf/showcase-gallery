import { useState } from "react";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/Card";
import { Loading, ErrorAlert, EmptyState, Badge } from "../../components/ui/Feedback";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Confirm from "../../components/ui/Confirm";
import { Field, Input, Textarea, FormError, Select } from "../../components/ui/Form";
import { useToast } from "../../components/ui/Toast";
import useAsync from "../../hooks/useAsync";
import { formatDate } from "../../api";
import * as api from "../../api";

export default function AnnouncementsPage({ canPost = false }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: items, loading, error, reload } = useAsync(
    () => api.listAnnouncements(),
    []
  );
  const { data: classes } = useAsync(() => (canPost ? api.listClasses() : Promise.resolve([])), [
    canPost,
  ]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (form._id) {
        await api.updateAnnouncement(form._id, { title: form.title, content: form.content });
        toast.success("Announcement updated");
      } else {
        await api.createAnnouncement({
          title: form.title,
          content: form.content,
          classId: form.classId,
        });
        toast.success("Announcement posted");
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
    await api.deleteAnnouncement(item._id);
    toast.success("Announcement deleted");
    await reload();
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="News and reminders from your classes."
        actions={
          canPost ? (
            <Button
              onClick={() => {
                setForm({
                  title: "",
                  content: "",
                  classId: classes && classes.length === 1 ? classes[0]._id : "",
                });
                setErrors("");
              }}
            >
              <Plus className="h-4 w-4" /> Post announcement
            </Button>
          ) : null
        }
      />

      <ErrorAlert onRetry={reload}>{error}</ErrorAlert>

      {loading ? (
        <Loading />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          hint={canPost ? "Post the first announcement for one of your classes." : undefined}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      {item.class?.name && <Badge tone="blue">{item.class.name}</Badge>}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {item.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.createdBy?.name ? `${item.createdBy.name} · ` : ""}
                      {formatDate(item.createdAt, true)}
                    </p>
                  </div>

                  {canPost && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            ...item,
                            classId: typeof item.class === "object" ? item.class._id : item.class,
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
                            title: "Delete announcement?",
                            message: `“${item.title}” will be removed.`,
                            action: () => remove(item),
                          })
                        }
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit announcement" : "Post announcement"}
        width="max-w-xl"
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>

            {!form._id && (
              <Field label="Class" required>
                <Select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  required
                >
                  <option value="">Choose a class…</option>
                  {(classes || []).map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Midterm schedule"
                required
              />
            </Field>

            <Field label="Message" required>
              <Textarea
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the announcement…"
                required
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy} disabled={!form._id && !form.classId}>
                {form._id ? "Save changes" : "Post"}
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
