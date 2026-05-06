const rawDomain: string | undefined = import.meta.env.VITE_PUBLIC_DOMAIN;

if (!rawDomain) {
  throw new Error(
    "VITE_PUBLIC_DOMAIN missing — set it in your .env.local file"
  );
}

const domain = rawDomain.replace(/\/+$/, "");

export const SITE = {
  name: "randomkey.online",
  shortName: "randomkey",
  domain,
  url: (path = "/") =>
    `${domain}${path.startsWith("/") ? path : `/${path}`}`,
  title: "randomkey.online — Secure Secret & Key Generator",
  description:
    "Privacy-first browser-native secret and key generator. Generate passwords, API keys, JWT secrets, SSH keys, UUIDs, and more — entirely in your browser.",
  keywords: [
    "key generator",
    "random key generator",
    "wifi password generator",
    "secret generator",
    "secret key generator",
    "password generator",
    "api key generator",
    "jwt secret generator",
    "uuid generator",
    "ssh key generator",
  ],
  twitterHandle: "@randomkeyonline",
  themeColor: "#0f172a",
} as const;

export type Site = typeof SITE;
