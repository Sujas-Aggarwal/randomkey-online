import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function TestCardPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="test-card">
      <PlaceholderTool toolId="test-card" />
    </ToolLayout>
  );
}
