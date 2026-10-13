import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function Confirm({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <p className="text-sm leading-relaxed text-slate-600">{message}</p>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
