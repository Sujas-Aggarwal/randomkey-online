import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function SshKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="ssh-key">
      <PlaceholderTool toolId="ssh-key" />
    </ToolLayout>
  );
}
