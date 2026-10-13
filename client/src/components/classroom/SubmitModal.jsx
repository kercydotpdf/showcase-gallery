import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Loading } from "../ui/Feedback";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Field, Textarea, FormError } from "../ui/Form";
import { useToast } from "../ui/Toast";
import { fileToDataUrl, formatDate, formatBytes } from "../../api";
import * as api from "../../api";

const MAX = 5 * 1024 * 1024;

/* ------------------------------------------------------------- student */
export default function SubmitModal({ assignment, onClose, onSaved }) {
  const toast = useToast();
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const assignmentId = assignment?._id;

  // The parent remounts this modal with a key, so state starts fresh each time.
  useEffect(() => {
    if (!assignmentId) return undefined;
    let cancelled = false;
    api
      .getAssignment(assignmentId)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setContent(d.mySubmission?.content || "");
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

  const graded = detail?.mySubmission?.status === "graded";

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors("");
    try {
      let payload = { content };
      if (file) {
        if (file.size > MAX) throw new Error("Attachment is too large. Maximum size is 5 MB.");
        payload.file = { name: file.name, url: await fileToDataUrl(file) };
      }
      await api.submitAssignment(assignment._id, payload);
      toast.success("Assignment submitted");
      onSaved();
    } catch (err) {
      setErrors(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!assignment) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title={assignment.title}
      subtitle={`${assignment.points} points${assignment.dueDate ? ` · due ${formatDate(assignment.dueDate, true)}` : ""}`}
      width="max-w-xl"
    >
      {assignment.instructions && (
        <div className="mb-4 rounded-lg bg-slate-50 px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 ring-1 ring-slate-200">
          {assignment.instructions}
        </div>
      )}

      {loading ? (
        <Loading label="Loading submission…" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormError>{errors}</FormError>

          {graded && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
              <p className="font-semibold">
                Graded: {detail.mySubmission.grade} / {assignment.points}
              </p>
              {detail.mySubmission.feedback && (
                <p className="mt-1">{detail.mySubmission.feedback}</p>
              )}
              <p className="mt-1 text-xs text-emerald-600">
                Graded work can no longer be changed.
              </p>
            </div>
          )}

          {!graded && (
            <>
              <Field label="Your answer" required>
                <Textarea
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your answer here…"
                  required
                />
              </Field>

              <Field label="Attachment (optional)" hint="Maximum 5 MB">
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

              {detail?.mySubmission && (
                <p className="text-xs text-slate-400">
                  You already submitted on {formatDate(detail.mySubmission.submittedAt, true)}.
                  Submitting again replaces your previous answer.
                </p>
              )}
            </>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {!graded && (
              <Button type="submit" loading={busy}>
                <Send className="h-4 w-4" />
                {detail?.mySubmission ? "Update submission" : "Submit"}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
