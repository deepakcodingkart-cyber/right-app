import { Button } from "@shopify/polaris";

export default function GlobalButton({
  label = "Button",
  onClick,
  variant = "primary", // ✅ default is primary
  tone, // optional: "critical" etc.
  submit = false,
  loading = false,
}) {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      variant={variant}
      tone={tone}
      type={submit ? "submit" : "button"} // ✅ proper submit handling
    >
      {label}
    </Button>
  );
}
