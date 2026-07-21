import { useRef, useState } from "react";
import { uploadReceipt } from "../api.js";

export default function UploadReceipt({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      await uploadReceipt(file);
      onUploaded();
    } catch (err) {
      setError(err.message || "Could not read that receipt. Try a clearer photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`upload-slot${dragging ? " dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <p>Feed a receipt photo in — Gemini reads the items, prices, and category.</p>
      <button
        className="upload-btn"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Reading receipt…" : "Scan a receipt"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {preview && <img className="upload-preview" src={preview} alt="Receipt preview" />}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
