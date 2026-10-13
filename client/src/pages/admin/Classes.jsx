import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "../../components/ui/Card";
import { Table, THead, TBody, Td, Tr } from "../../components/ui/Table";
import { Loading, EmptyState, ErrorAlert, Badge } from "../../components/ui/Feedback";
import SearchInput from "../../components/ui/SearchInput";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Confirm from "../../components/ui/Confirm";
import { Field, Input, Select, FormError } from "../../components/ui/Form";
import { useToast } from "../../components/ui/Toast";
import useAsync from "../../hooks/useAsync";
import * as api from "../../api";

const EMPTY = { name: "", subject: "", teacher: "", schedule: "" };

export default function Classes({ title = "Classes", subtitle, canCreate = true }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data: classes, loading, error, reload } = useAsync(
    () => api.listClasses({ search }),
    [search]
  );
  const { data: subjects } = useAsync(() => api.listSubjects(), []);
  const { data: teachers } = useAsync(() => api.listUsers({ role: "teacher" }), []);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      const payload = {
        name: form.name,
        subject: form.subject,
        teacher: form.teacher || null,
        schedule: form.schedule,
      };
      if (form._id) {
        await api.updateClass(form._id, payload);
        toast.success("Class updated");
      } else {
        await api.createClass(payload);
        toast.success("Class created");
      }
      setForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(cls) {
    await api.deleteClass(cls._id);
    toast.success("Class deleted");
    await reload();
  }

  const rows = classes || [];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle || "Sections created from a subject with a teacher and students."}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search classes…" />
            {canCreate && (
              <Button
                onClick={() => {
                  setForm({ ...EMPTY });
                  setErrors("");
                }}
              >
                + Create class
              </Button>
            )}
          </>
        }
      />

      <ErrorAlert>{error}</ErrorAlert>

      <div className="mt-3">
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={error ? "Could not load classes" : "No classes yet"}
            hint={
              error
                ? undefined
                : "Create a subject first, then open a class section for it and assign a teacher."
            }
            action={
              error ? undefined : canCreate ? (
                <Button onClick={() => { setForm({ ...EMPTY }); setErrors(""); }}>Create class</Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <THead
              columns={[
                { key: "name", label: "Class" },
                { key: "subject", label: "Subject" },
                { key: "teacher", label: "Teacher" },
                { key: "students", label: "Students", width: "110px" },
                { key: "schedule", label: "Schedule" },
                { key: "actions", label: "", width: "130px" },
              ]}
            />
            <TBody
              rows={rows}
              columns={6}
              renderRow={(cls) => (
                <Tr key={cls._id} onClick={() => navigate(`/admin/classes/${cls._id}`)}>
                  <Td>
                    <span className="font-medium text-slate-800">{cls.name}</span>
                  </Td>
                  <Td>
                    {cls.subject ? (
                      <div>
                        <span className="font-medium text-sage">{cls.subject.code}</span>
                        <span className="ml-2 text-slate-500">{cls.subject.title}</span>
                      </div>
                    ) : (
                      <Badge tone="rose">No subject</Badge>
                    )}
                  </Td>
                  <Td>{cls.teacher ? cls.teacher.name : <Badge tone="amber">Unassigned</Badge>}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Users className="h-4 w-4 text-slate-400" />
                      {cls.students?.length || 0}
                    </span>
                  </Td>
                  <Td>{cls.schedule || "—"}</Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/admin/classes/${cls._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md px-2 py-1.5 text-xs font-medium text-sage hover:bg-mist"
                      >
                        Roster
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({
                            _id: cls._id,
                            name: cls.name,
                            subject: cls.subject?._id || "",
                            teacher: cls.teacher?._id || "",
                            schedule: cls.schedule || "",
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirm({
                            title: `Delete ${cls.name}?`,
                            message:
                              "This removes the class together with its modules, lessons, assignments, quizzes and announcements.",
                            action: () => remove(cls),
                          });
                        }}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              )}
            />
          </Table>
        )}
      </div>

      <Modal
        open={Boolean(form)}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit class" : "Create class"}
        subtitle="A class is one section of a subject taught by one teacher."
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>

            <Field label="Class / section name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="BSIT 2A"
                required
              />
            </Field>

            <Field label="Subject" required>
              <Select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              >
                <option value="">Select a subject…</option>
                {(subjects || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} — {s.title}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teacher" hint="Optional — can be assigned later">
                <Select
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                >
                  <option value="">No teacher assigned</option>
                  {(teachers || [])
                    .filter((t) => t.active)
                    .map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                </Select>
              </Field>

              <Field label="Schedule">
                <Input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  placeholder="MWF 8:00 - 9:00 AM"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>
                {form._id ? "Save changes" : "Create class"}
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
