import { Form, useNavigation  } from "@remix-run/react";
import Modal from "../../../components/Modal";
import FormInput from "../../../components/FormInput";
import FormActions from "../../../components/FormActions";

export default function EditVariantModal({ variant, onClose }) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && 
                      navigation.formData?.get("_action") === "updateVariant";

  return (
    <Modal onClose={onClose} width={500}>
      <h2>Edit Variant</h2>
      <Form method="post">
        <input type="hidden" name="_action" value="updateVariant" />
        <input type="hidden" name="variantId" value={variant.id} />

        <FormInput
          label="Title"
          name="title"
          defaultValue={variant.title}
          disabled={isSubmitting}
        />

        <FormInput
          label="SKU"
          name="sku"
          defaultValue={variant.sku}
          disabled={isSubmitting}
        />

        <FormInput
          label="Price"
          name="price"
          defaultValue={variant.price}
          disabled={isSubmitting}
        />

        <FormInput
          label="Compare at Price"
          name="compareAtPrice"
          defaultValue={variant.compare_at_price}
          disabled={isSubmitting}
        />

        <FormActions 
          onCancel={onClose}
          submitLabel={isSubmitting ? "Saving..." : "Save"}
          disabled={isSubmitting}
        />
      </Form>
    </Modal>
  );
}