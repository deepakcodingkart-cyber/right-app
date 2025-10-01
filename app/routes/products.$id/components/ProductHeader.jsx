import { Form } from "@remix-run/react";
import GlobalButton from "../../../components/GlobalButton";
import StatusBadge from "../../../components/StatusBadge";

export default function ProductHeader({ product, onEditClick }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "1.5rem",
        gap: "1rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: 8 }}>
          {product.title}
        </h1>
        <div style={{ color: "#555", fontSize: "1rem" }}>
          Vendor: {product.vendor}
        </div>
        <div style={{ color: "#777", fontSize: "0.95rem" }}>
          Tags: {product.tags || "—"}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <GlobalButton
          label="Edit"
          variant="secondary"
          onClick={onEditClick}
        />
        <Form method="post">
          <input type="hidden" name="_action" value="delete" />
          <GlobalButton label="Delete" variant="danger" submit />
        </Form>
      </div>

      <StatusBadge status={product.status} />
    </div>
  );
}