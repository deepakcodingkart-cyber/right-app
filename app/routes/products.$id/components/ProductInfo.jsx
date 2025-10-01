export default function ProductInfo({ product }) {
  const totalInventory = product.variants?.reduce(
    (sum, v) => sum + (v.inventory_quantity ?? 0),
    0
  );

  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Inventory:</strong>{" "}
        {totalInventory > 0
          ? `${totalInventory} in stock for ${product.variants?.length} variants`
          : "Inventory not tracked"}
      </div>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Category:</strong> {product.product_type || "—"}
      </div>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Channels:</strong> {product.published_scope || "—"}
      </div>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Handle:</strong> {product.handle}
      </div>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Created:</strong>{" "}
        {new Date(product.created_at).toLocaleDateString()}
      </div>
      <div style={{ marginBottom: 12, fontSize: "1rem" }}>
        <strong>Last Updated:</strong>{" "}
        {new Date(product.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}