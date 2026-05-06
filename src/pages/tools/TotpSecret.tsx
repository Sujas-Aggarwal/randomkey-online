import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function TotpSecretPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="totp-2fa">
      <PlaceholderTool toolId="totp-2fa" />
    </ToolLayout>
  );
}
