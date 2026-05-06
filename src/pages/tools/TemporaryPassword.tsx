import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function TemporaryPasswordPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="temporary-password">
      <PlaceholderTool toolId="temporary-password" />
    </ToolLayout>
  );
}
