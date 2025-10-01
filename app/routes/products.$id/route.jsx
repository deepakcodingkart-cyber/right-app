import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { authenticate } from "../../shopify.server";
import { json, redirect } from "@remix-run/node";
import { useEffect, useState } from "react";
import ProductHeader from "./components/ProductHeader";
import ProductImageGallery from "./components/ProductImageGallery";
import ProductInfo from "./components/ProductInfo";
import VariantsSection from "./components/VariantsSection";
import EditProductModal from "./components/EditProductModal";
import EditVariantModal from "./components/EditVariantModal";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";

const API_VERSION = "2025-07";

/* ---------------- LOADER: Fetch product (REST API) ---------------- */
export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const accessToken = session.accessToken;

  const url = `https://${shop}/admin/api/${API_VERSION}/products/${params.id}.json`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Response("Failed to fetch product", { status: res.status });
  }

  const data = await res.json();
  return data.product;
};

/* ---------------- ACTION: Update product (GraphQL API) ---------------- */
export const action = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const accessToken = session.accessToken;
  const { id } = params;

  const formData = await request.formData();
  const _action = formData.get("_action");

  // DELETE
  if (_action === "delete") {
    const url = `https://${shop}/admin/api/${API_VERSION}/products/${id}.json`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });
    return redirect("/products");
  }

  // UPDATE (GraphQL)
  if (_action === "update") {
    const gid = `gid://shopify/Product/${id}`;
    const title = formData.get("title");
    const descriptionHtml = formData.get("descriptionHtml");
    const vendor = formData.get("vendor");
    const productType = formData.get("productType");
    const tags = formData
      .get("tags")
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const mutation = `
      mutation updateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            descriptionHtml
            vendor
            productType
            tags
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        id: gid,
        title,
        descriptionHtml,
        vendor,
        productType,
        tags,
      },
    };

    const res = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const result = await res.json();

    if (result.data?.productUpdate?.userErrors?.length) {
      return json(
        { errors: result.data.productUpdate.userErrors },
        { status: 400 }
      );
    }

    return redirect(`/products/${id}`);
  }

  if (_action === "updateVariant") {
    const variantId = formData.get("variantId");
    const gid = `gid://shopify/ProductVariant/${variantId}`;
    const productGid = `gid://shopify/Product/${id}`;

    const sku = formData.get("sku");
    const price = formData.get("price");
    const compareAtPrice = formData.get("compareAtPrice");

    console.log("🟡 Updating Variant:", {
      productGid,
      variantId,
      gid,
      sku,
      price,
      compareAtPrice,
    });

    const mutation = `
    mutation updateVariantBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        product {
          id
          title
        }
        productVariants {
          id
          price
          compareAtPrice
          inventoryItem {
            sku
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

    const variables = {
      productId: productGid,
      variants: [
        {
          id: gid,
          price,
          compareAtPrice,
          inventoryItem: {
            sku,
          },
        },
      ],
    };

    const res = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const result = await res.json();

    console.log("🟢 Shopify Variant Update Response:", JSON.stringify(result, null, 2));

    if (result.data?.productVariantsBulkUpdate?.userErrors?.length) {
      console.error(
        "🔴 User Errors:",
        result.data.productVariantsBulkUpdate.userErrors
      );
      return json(
        { errors: result.data.productVariantsBulkUpdate.userErrors },
        { status: 400 }
      );
    }

    return redirect(`/products/${id}`);
  }
  return null;
};

/* ---------------- MAIN COMPONENT ---------------- */
export default function ProductDetail() {
  const product = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const { toasts, showToast, removeToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(
    product.image?.src || product.images?.[0]?.src
  );
  const [showEdit, setShowEdit] = useState(false);
  const [showVariantEdit, setShowVariantEdit] = useState(null);

  // Handle successful actions and show toasts
  useEffect(() => {
    if (navigation.state === "idle" && actionData) {
      if (actionData.errors) {
        // Show error toast if there are errors
        showToast("Update failed: " + actionData.errors[0]?.message, "error");
      } else if (navigation.formData) {
        const actionType = navigation.formData.get("_action");
        if (actionType === "update") {
          showToast("Product updated successfully!");
          setShowEdit(false); // Close modal on success
        } else if (actionType === "updateVariant") {
          showToast("Variant updated successfully!");
          setShowVariantEdit(null); // Close modal on success
        } else if (actionType === "delete") {
          showToast("Product deleted successfully!");
        }
      }
    }
  }, [navigation.state, actionData, navigation.formData, showToast]);

  // Close modals when navigation starts (form submission)
  useEffect(() => {
    if (navigation.state === "submitting") {
      const actionType = navigation.formData?.get("_action");
      if (actionType === "update") {
        setShowEdit(false);
      } else if (actionType === "updateVariant") {
        setShowVariantEdit(null);
      }
    }
  }, [navigation.state, navigation.formData]);

  if (!product) return <div>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "auto" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
          padding: "2rem",
        }}
      >
        <ProductHeader 
          product={product} 
          onEditClick={() => setShowEdit(true)}
        />

        <div style={{ display: "flex", gap: "2rem" }}>
          <ProductImageGallery 
            product={product}
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
          />
          
          <ProductInfo product={product} />
        </div>

        <VariantsSection 
          product={product}
          onVariantEdit={setShowVariantEdit}
        />
      </div>

      {showEdit && (
        <EditProductModal 
          product={product}
          onClose={() => setShowEdit(false)}
        />
      )}
      
      {showVariantEdit && (
        <EditVariantModal 
          variant={showVariantEdit}
          onClose={() => setShowVariantEdit(null)}
        />
      )}

      {/* Toast notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}