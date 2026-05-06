import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function HmacKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="hmac-key">
      <PlaceholderTool toolId="hmac-key" />
    </ToolLayout>
  );
}
