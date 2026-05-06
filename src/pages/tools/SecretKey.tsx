import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function SecretKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="secret-key">
      <PlaceholderTool toolId="secret-key" />
    </ToolLayout>
  );
}
