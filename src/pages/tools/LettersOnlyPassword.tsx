import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function LettersOnlyPasswordPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="letters-only-password">
      <PlaceholderTool toolId="letters-only-password" />
    </ToolLayout>
  );
}
