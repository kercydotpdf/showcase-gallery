import { useState } from "react";
import { Upload, Link2, FileText, Download, Trash2, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import { Loading, EmptyState, ErrorAlert, Badge } from "../ui/Feedback";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Confirm from "../ui/Confirm";
import { Field, Input, FormError } from "../ui/Form";
import { useToast } from "../ui/Toast";
import useAsync from "../../hooks/useAsync";
import { fileToDataUrl, formatBytes, formatDate } from "../../api";
import * as api from "../../api";

const MAX = 5 * 1024 * 1024;

export default function MaterialsPanel({ classId, canEdit }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.listMaterials(classId),
    [classId]
  );
  const materials = data || [];

  function reset() {
    setTitle("");
    setUrl("");
    setFile(null);
    setType("file");
    setErrors("");
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      if (!title.trim()) throw new Error("Give the material a title.");

      if (type === "link") {
        if (!/^https?:\/\//i.test(url)) throw new Error("Links must start with http:// or https://");
        await api.createMaterial({
          title: title.trim(),
          type: "link",
          url,
          classId,
        });
      } else {
        if (!file) throw new Error("Choose a file to upload.");
        if (file.size > MAX) throw new Error("File is too large. Maximum size is 5 MB.");
        const dataUrl = await fileToDataUrl(file);
        await api.createMaterial({
          title: title.trim(),
          type: "file",
          url: dataUrl,
          filename: file.name,
          size: file.size,
          classId,
        });
      }

      toast.success("Material added");
      setShowModal(false);
      reset();
      await reload();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(material) {
    await api.deleteMaterial(material._id);
    toast.success("Material deleted");
    await reload();
  }

  function openMaterial(material) {
    if (material.type === "link") {
      window.open(material.url, "_blank", "noopener");
      return;
    }
    const a = document.createElement("a");
    a.href = material.url;
    a.download = material.filename || material.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <Card>
      <CardHeader
        title="Learning materials"
        subtitle="Files and external resources shared with the class"
        action={
          canEdit ? (
            <Button size="sm" onClick={() => { reset(); setShowModal(true); }}>
              <Upload className="h-4 w-4" /> Add material
            </Button>
          ) : null
        }
      />

      <ErrorAlert>{error}</ErrorAlert>

      {loading ? (
        <Loading />
      ) : materials.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={FileText}
            title="No materials yet"
            hint={canEdit ? "Upload a small file or share an external link." : undefined}
          />
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {materials.map((m) => (
            <li key={m._id} className="flex items-center gap-3 px-5 py-3.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  m.type === "link" ? "bg-lavender text-sage" : "bg-mist text-sage"
                }`}
              >
                {m.type === "link" ? <Link2 className="h-4.5 w-4.5" /> : <FileText className="h-4.5 w-4.5" />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{m.title}</p>
                <p className="text-xs text-slate-400">
                  {m.type === "file"
                    ? `${m.filename || "file"}${m.size ? ` · ${formatBytes(m.size)}` : ""} · `
                    : ""}
                  Added {formatDate(m.createdAt)}
                </p>
              </div>

              <Badge tone={m.type === "link" ? "violet" : "blue"}>
                {m.type === "link" ? "Link" : "File"}
              </Badge>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => openMaterial(m)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-sage hover:bg-mist"
                >
                  {m.type === "link" ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{m.type === "link" ? "Open" : "Download"}</span>
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirm({
                        title: "Delete material?",
                        message: `“${m.title}” will be removed for everyone in the class.`,
                        action: () => remove(m),
                      })
                    }
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add learning material"
        subtitle="Small files (max 5 MB) are stored in the database, or share a link."
      >
        <form onSubmit={save} className="space-y-4">
          <FormError>{errors}</FormError>

          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "file", label: "Upload a file", icon: Upload },
              { key: "link", label: "External link", icon: Link2 },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setType(opt.key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  type === opt.key
                    ? "border-sage bg-mist text-sage-dark"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>

          <Field label="Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Week 1 notes"
              required
            />
          </Field>

          {type === "file" ? (
            <Field label="File" required hint="Maximum 5 MB">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:border-sage-light"
              />
              {file && (
                <p className="mt-1 text-xs text-slate-500">
                  {file.name} · {formatBytes(file.size)}
                </p>
              )}
            </Field>
          ) : (
            <Field label="Link address" required>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                required
              />
            </Field>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={busy}>Add material</Button>
          </div>
        </form>
      </Modal>

      <Confirm
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        onConfirm={confirm?.action}
        onClose={() => setConfirm(null)}
      />
    </Card>
  );
}
