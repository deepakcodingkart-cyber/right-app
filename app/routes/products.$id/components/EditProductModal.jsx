import { Form, useNavigation } from "@remix-run/react";
import Modal from "../../../components/Modal";
import FormInput from "../../../components/FormInput";
import FormActions from "../../../components/FormActions";

export default function EditProductModal({ product, onClose }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
                      navigation.formData?.get("_action") === "update";

  return (
    <Modal onClose={onClose}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: 600, marginBottom: 16 }}>
        Edit Product
      </h2>

      <Form method="post">
        <input type="hidden" name="_action" value="update" />

        <FormInput
          label="Title"
          name="title"
          defaultValue={product.title}
          disabled={isSubmitting}
        />

        <FormInput
          label="Description"
          name="descriptionHtml"
          defaultValue={product.body_html}
          textarea={true}
          disabled={isSubmitting}
        />

        <FormInput
          label="Vendor"
          name="vendor"
          defaultValue={product.vendor}
          disabled={isSubmitting}
        />

        <FormInput
          label="Product Type"
          name="productType"
          defaultValue={product.product_type}
          disabled={isSubmitting}
        />

        <FormInput
          label="Tags (comma separated)"
          name="tags"
          defaultValue={product.tags}
          disabled={isSubmitting}
        />

        <FormActions 
          onCancel={onClose}
          submitLabel={isSubmitting ? "Saving..." : "Save Changes"}
          disabled={isSubmitting}
        />
      </Form>
    </Modal>
  );
}