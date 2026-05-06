import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function AesKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="aes-key">
      <PlaceholderTool toolId="aes-key" />
    </ToolLayout>
  );
}
