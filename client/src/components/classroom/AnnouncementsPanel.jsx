import { useState } from "react";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
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

export default function AnnouncementsPanel({ classId, canEdit }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listAnnouncements(classId ? { classId } : {}),
    [classId]
  );
  const items = data || [];

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (form._id) {
        await api.updateAnnouncement(form._id, {
          title: form.title,
          content: form.content,
        });
        toast.success("Announcement updated");
      } else {
        await api.createAnnouncement({
          title: form.title,
          content: form.content,
          classId,
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
      <Card>
        <CardHeader
          title="Announcements"
          subtitle="News and reminders posted for this class"
          action={
            canEdit ? (
              <Button
                size="sm"
                onClick={() => {
                  setForm({ title: "", content: "" });
                  setErrors("");
                }}
              >
                <Plus className="h-4 w-4" /> Post announcement
              </Button>
            ) : null
          }
        />

        <ErrorAlert>{error}</ErrorAlert>

        {loading ? (
          <Loading />
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              hint={canEdit ? "Post the first announcement for the class." : undefined}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {item.content}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.createdBy?.name ? `${item.createdBy.name} · ` : ""}
                      {item.class?.name ? `${item.class.name} · ` : ""}
                      {formatDate(item.createdAt, true)}
                    </p>
                  </div>

                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...item });
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
        )}
      </Card>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit announcement" : "Post announcement"}
        width="max-w-xl"
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>
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
              <Button type="submit" loading={busy}>
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
