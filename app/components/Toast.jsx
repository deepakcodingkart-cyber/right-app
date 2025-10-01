import { useEffect, useState } from "react";

export default function Toast({ message, type = "success", onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade-out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "#d1fadf" : "#fde2e1";
  const textColor = type === "success" ? "#0a7d4f" : "#b42318";
  const borderColor = type === "success" ? "#0a7d4f" : "#b42318";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 10000,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(-20px)",
        transition: "all 0.3s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>
        {type === "success" ? "✅" : "❌"}
      </span>
      {message}
    </div>
  );
}