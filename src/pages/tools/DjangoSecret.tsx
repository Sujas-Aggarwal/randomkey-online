import { ToolLayout } from "@/layouts/ToolLayout";
import { PlaceholderTool } from "@/pages/tools/PlaceholderTool";

export default function DjangoSecretPage(): React.JSX.Element {
  return (
    <ToolLayout toolId="django-secret">
      <PlaceholderTool toolId="django-secret" />
    </ToolLayout>
  );
}
