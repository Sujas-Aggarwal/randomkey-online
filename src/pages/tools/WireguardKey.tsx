import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function WireguardKeyPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="wireguard-key">
      <PlaceholderTool toolId="wireguard-key" />
    </ToolLayout>
  );
}
