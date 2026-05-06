import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function UsernameGeneratorPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="username-generator">
      <PlaceholderTool toolId="username-generator" />
    </ToolLayout>
  );
}
