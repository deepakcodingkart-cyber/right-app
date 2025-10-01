// import React from "react";
import { Modal } from "@shopify/polaris";

export default function GlobalModal({
  open,
  title,
  children,
  onClose,
  primaryAction,
  secondaryAction,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      primaryAction={primaryAction}
      secondaryActions={secondaryAction ? [secondaryAction] : []}
    >
      <Modal.Section>
        {children}
      </Modal.Section>
    </Modal>
  );
}
