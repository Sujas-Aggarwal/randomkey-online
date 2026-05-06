import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function EncryptionKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="encryption-key">
      <PlaceholderTool toolId="encryption-key" />
    </ToolLayout>
  );
}
