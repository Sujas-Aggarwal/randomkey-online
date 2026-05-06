import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function MasterPasswordPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="master-password">
      <PlaceholderTool toolId="master-password" />
    </ToolLayout>
  );
}
