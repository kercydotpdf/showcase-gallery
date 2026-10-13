import { useState } from "react";
import { Pencil, Trash2, UserCheck, UserX } from "lucide-react";
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

const EMPTY = { name: "", email: "", password: "", role: "student", studentNo: "", department: "" };

export default function UsersPage({ role, title, subtitle }) {
  const isStudent = role === "student";
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null = closed
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listUsers({ role, search }),
    [role, search]
  );

  const users = data || [];

  function openCreate() {
    setForm({ ...EMPTY, role });
    setErrors("");
  }

  function openEdit(user) {
    setForm({ ...user, password: "" });
    setErrors("");
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (form._id) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
          studentNo: form.studentNo,
          department: form.department,
          active: form.active,
        };
        if (form.password) payload.password = form.password;
        await api.updateUser(form._id, payload);
        toast.success(`${isStudent ? "Student" : "Teacher"} updated`);
      } else {
        await api.createUser(form);
        toast.success(`${isStudent ? "Student" : "Teacher"} account created`);
      }
      setForm(null);
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user) {
    try {
      await api.updateUser(user._id, { active: !user.active });
      toast.success(user.active ? "Account deactivated" : "Account activated");
      await reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function hardDelete(user) {
    await api.deleteUser(user._id, true);
    toast.success("Account permanently deleted");
    await reload();
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${role}s…`} />
            <Button onClick={openCreate}>+ Add {isStudent ? "student" : "teacher"}</Button>
          </>
        }
      />

      <ErrorAlert>{error}</ErrorAlert>

      <div className="mt-3">
        {loading ? (
          <Loading />
        ) : users.length === 0 ? (
          <EmptyState
            title={error ? "Could not load accounts" : `No ${role}s yet`}
            hint={error ? undefined : `Add the first ${role} account to get started.`}
            action={error ? undefined : <Button onClick={openCreate}>Add {role}</Button>}
          />
        ) : (
          <Table>
            <THead
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                isStudent
                  ? { key: "studentNo", label: "Student No." }
                  : { key: "department", label: "Department" },
                { key: "status", label: "Status", width: "120px" },
                { key: "actions", label: "", width: "150px" },
              ]}
            />
            <TBody
              rows={users}
              columns={5}
              empty={`No ${role}s found.`}
              renderRow={(user) => (
                <Tr key={user._id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>{isStudent ? user.studentNo || "—" : user.department || "—"}</Td>
                  <Td>
                    <Badge tone={user.active ? "green" : "rose"}>
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-sage"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                        title={user.active ? "Deactivate" : "Activate"}
                      >
                        {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            title: `Delete ${user.name}?`,
                            message:
                              "This permanently removes the account. If the person still has classes, deactivate the account instead.",
                            action: () => hardDelete(user),
                          })
                        }
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
        title={form?._id ? `Edit ${role}` : `Add ${role}`}
        subtitle={form?._id ? "Update the account details below." : "Create a new login account."}
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <FormError>{errors}</FormError>

            <Field label="Full name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Juan Dela Cruz"
                required
              />
            </Field>

            <Field label="Email address" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@school.edu"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              {isStudent ? (
                <Field label="Student number">
                  <Input
                    value={form.studentNo || ""}
                    onChange={(e) => setForm({ ...form, studentNo: e.target.value })}
                    placeholder="2024-0001"
                  />
                </Field>
              ) : (
                <Field label="Department">
                  <Input
                    value={form.department || ""}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Information Technology"
                  />
                </Field>
              )}

              <Field label={form._id ? "New password" : "Password"} required={!form._id} hint={form._id ? "Leave blank to keep the current password" : "Minimum 6 characters"}>
                <Input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={form._id ? "••••••" : "At least 6 characters"}
                  minLength={form._id ? undefined : 6}
                />
              </Field>
            </div>

            {form._id && (
              <Field label="Account status">
                <Select
                  value={form.active ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}
                >
                  <option value="active">Active — can sign in</option>
                  <option value="inactive">Inactive — cannot sign in</option>
                </Select>
              </Field>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                {form._id ? "Save changes" : "Create account"}
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
