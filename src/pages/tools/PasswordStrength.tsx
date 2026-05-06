import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function PasswordStrengthPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="password-strength">
      <PlaceholderTool toolId="password-strength" />
    </ToolLayout>
  );
}
