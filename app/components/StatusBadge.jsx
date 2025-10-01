export default function StatusBadge({ status }) {
  const statusConfig = {
    active: {
      background: "#d1fadf",
      color: "#0a7d4f"
    },
    draft: {
      background: "#fef0c7",
      color: "#b54708"
    },
    archived: {
      background: "#fde2e1",
      color: "#b42318"
    }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      style={{
        background: config.background,
        color: config.color,
        padding: "0.4em 1em",
        borderRadius: "999px",
        fontWeight: 500,
        textTransform: "capitalize",
        fontSize: "0.95rem",
        height: "fit-content",
      }}
    >
      {status}
    </span>
  );
}