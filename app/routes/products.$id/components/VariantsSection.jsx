import GlobalTable from "../../../components/GlobalTable";
import GlobalButton from "../../../components/GlobalButton";

export default function VariantsSection({ product, onVariantEdit }) {
  const rows = product.variants?.map((v) => [
    v.title,
    v.sku || "—",
    `₹${v.price}`,
    v.compare_at_price ? `₹${v.compare_at_price}` : "—",
    v.inventory_quantity ?? "—",
    <GlobalButton
      key={v.id}
      label="Edit Variant"
      variant="secondary"
      onClick={() => onVariantEdit(v)}
    />,
  ]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 12 }}>
        Variants
      </h2>
      <GlobalTable
        headers={["Title", "SKU", "Price", "Compare at", "Inventory", "Actions"]}
        rows={rows}
      />
    </div>
  );
}