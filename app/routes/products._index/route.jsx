import React, { useState, useEffect } from "react";
import {
  useLoaderData,
  useNavigate,
  Form,
  useNavigation,
} from "@remix-run/react";
import {
  Thumbnail,
  Text,
  TextField,
  Button,
  FormLayout,
} from "@shopify/polaris";

// Import server functions
import { loader ,action } from "../../services/products.server";


import GlobalTable from "../../components/GlobalTable";


// Export server functions for Remix
export { loader, action };

export default function ProductsList() {
  const { products, pageInfo } = useLoaderData();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);

  // Form state for modal
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("");
  const [optionName, setOptionName] = useState("");
  const [optionValues, setOptionValues] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      setTitle("");
      setVendor("");
      setPrice("");
      setProductType("");
      setOptionName("");
      setOptionValues("");
    }
  }, [showModal]);

  // Build rows for GlobalTable
  const rows = products.map((product) => {
    const totalInventory = product.variants?.reduce(
      (sum, v) => sum + (v.inventory_quantity ?? 0),
      0
    );

    return [
      product.image ? (
        <Thumbnail
          key="thumbnail"
          source={product.image.src}
          alt={product.image.alt || product.title}
          size="small"
        />
      ) : (
        <div
          key="no-img"
          style={{
            width: 40,
            height: 40,
            background: "#f5f5f5",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            color: "#aaa",
          }}
        >
          No Img
        </div>
      ),
      <Text key="title" variant="bodyMd" fontWeight="medium" as="span">
        <span
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/products/${product.id}`)}
        >
          {product.title}
        </span>
      </Text>,
      <Text
        key="status"
        tone={product.status === "ACTIVE" ? "success" : "critical"}
        as="span"
      >
        {product.status.toLowerCase()}
      </Text>,
      totalInventory > 0
        ? `${totalInventory} in stock for ${product.variants?.length} variants`
        : "Inventory not tracked",
      product.product_type || "—",
      product.vendor || "—",
      <Form
        key={`delete-${product.id}`}
        method="post"
        onSubmit={(e) => {
          console.log("Form submitted for product:", product.id);
          // Let the form submit naturally
        }}
      >
        <input type="hidden" name="_action" value="delete" />
        <input type="hidden" name="deleteIds" value={product.id} />

        <Button
          submit
          destructive
          loading={navigation.state === "submitting"}
        >
          Delete
        </Button>
      </Form>,
    ];
  });

  return (
    <div style={{ padding: "2rem" }}>
      {/* Debug info */}
      <div style={{
        background: '#f5f5f5',
        padding: '10px',
        marginBottom: '20px',
        borderRadius: '5px'
      }}>
        <Text as="p">Form State: {navigation.state}</Text>
        <Text as="p">Products Count: {products.length}</Text>
      </div>
      
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Products</h1>

        <Button
          primary
          onClick={() => setShowModal(true)}
        >
          Create Product
        </Button>
      </div>

      {/* Modal for Creating Product */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create Product</h2>
              <Button
                plain
                onClick={() => setShowModal(false)}
              >
                ×
              </Button>
            </div>

            <Form
              method="post"
              onSubmit={() => {
                if (navigation.state === "submitting") {
                  setShowModal(false);
                }
              }}
            >
              <input type="hidden" name="_action" value="create" />

              <FormLayout>
                <TextField
                  label="Title"
                  name="title"
                  value={title}
                  onChange={setTitle}
                  requiredIndicator
                  autoComplete="off"
                />

                <TextField
                  label="Vendor"
                  name="vendor"
                  value={vendor}
                  onChange={setVendor}
                  autoComplete="off"
                />

                <FormLayout.Group>
                  <TextField
                    label="Price"
                    type="number"
                    name="price"
                    value={price}
                    onChange={setPrice}
                    autoComplete="off"
                    prefix="$"
                  />
                  <TextField
                    label="Product Type"
                    name="product_type"
                    value={productType}
                    onChange={setProductType}
                    autoComplete="off"
                  />
                </FormLayout.Group>

                <TextField
                  label="Option Name"
                  name="option_name"
                  value={optionName}
                  onChange={setOptionName}
                  autoComplete="off"
                  helpText="e.g., Size, Color, Material"
                />

                <TextField
                  label="Option Values (comma separated)"
                  name="option_values"
                  placeholder="S, M, L"
                  value={optionValues}
                  onChange={setOptionValues}
                  autoComplete="off"
                  helpText="Separate values with commas"
                />

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <Button
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    submit
                    primary
                    loading={navigation.state === "submitting"}
                    disabled={!title.trim()}
                  >
                    {navigation.state === "submitting" ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </FormLayout>
            </Form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <GlobalTable
        headers={[
          "Image",
          "Product",
          "Status",
          "Inventory",
          "Category",
          "Vendor",
          "Actions",
        ]}
        rows={rows}
      />

      {/* Pagination */}
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        {pageInfo?.hasPreviousPage && (
          <Button
            onClick={() =>
              navigate(`/products?cursor=${encodeURIComponent(pageInfo.startCursor)}`)
            }
          >
            Previous
          </Button>
        )}
        {pageInfo?.hasNextPage && (
          <Button
            onClick={() =>
              navigate(`/products?cursor=${encodeURIComponent(pageInfo.endCursor)}`)
            }
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
