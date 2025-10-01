export default function FormActions({ 
  submitLabel = "Save Changes", 
  cancelLabel = "Cancel",
  onCancel,
  disabled = false
}) {
  return (
    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
      <button type="submit" disabled={disabled}>
        {submitLabel}
      </button>
      <button type="button" onClick={onCancel} disabled={disabled}>
        {cancelLabel}
      </button>
    </div>
  );
}