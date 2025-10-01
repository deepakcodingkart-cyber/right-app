export default function ProductImageGallery({ product, selectedImage, onImageSelect }) {
  return (
    <div style={{ flex: "0 0 45%" }}>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: "1rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={product.title}
            style={{
              width: "100%",
              maxHeight: 400,
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 400,
              background: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
            }}
          >
            No Image
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto" }}>
        {product.images?.map((img) => (
          <img
            key={img.id}
            src={img.src}
            alt={product.title}
            style={{
              width: 70,
              height: 70,
              objectFit: "cover",
              borderRadius: 8,
              cursor: "pointer",
              border:
                img.src === selectedImage
                  ? "2px solid #0a7d4f"
                  : "1px solid #eee",
            }}
            onClick={() => onImageSelect(img.src)}
          />
        ))}
      </div>
    </div>
  );
}