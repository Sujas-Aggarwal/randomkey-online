export type ToolCategory =
  | "PASSWORDS"
  | "RECOVERY"
  | "HOME_GAMING"
  | "DEVELOPER"
  | "FRAMEWORKS"
  | "ENCRYPTION"
  | "ADVANCED"
  | "USERNAME"
  | "EDUCATION";

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  keywords: string[];
  icon: string;
  /** Relative import path for lazy loading */
  componentPath: string;
}

export interface ToolCategory_ {
  id: ToolCategory;
  label: string;
  description: string;
}
