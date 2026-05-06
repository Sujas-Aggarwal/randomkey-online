import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function HashGeneratorPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="hash-generator">
      <PlaceholderTool toolId="hash-generator" />
    </ToolLayout>
  );
}
