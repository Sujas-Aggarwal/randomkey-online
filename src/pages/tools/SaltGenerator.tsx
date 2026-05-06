import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function SaltGeneratorPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="salt-generator">
      <PlaceholderTool toolId="salt-generator" />
    </ToolLayout>
  );
}
