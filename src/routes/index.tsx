import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/pages/HomePage";

const PrivacyPage = lazy(() => import("@/pages/PrivacyPage").then((m) => ({ default: m.PrivacyPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then((m) => ({ default: m.AboutPage })));

// Lazy load all tool pages
const PasswordGenerator = lazy(() => import("@/pages/tools/PasswordGenerator"));
const PassphraseGenerator = lazy(() => import("@/pages/tools/PassphraseGenerator"));
const PronounceablePassword = lazy(() => import("@/pages/tools/PronounceablePassword"));
const MemorablePassword = lazy(() => import("@/pages/tools/MemorablePassword"));
const MasterPassword = lazy(() => import("@/pages/tools/MasterPassword"));
const BulkPassword = lazy(() => import("@/pages/tools/BulkPassword"));
const PasswordPresets = lazy(() => import("@/pages/tools/PasswordPresets"));
const EightCharPassword = lazy(() => import("@/pages/tools/EightCharPassword"));
const SixteenCharPassword = lazy(() => import("@/pages/tools/SixteenCharPassword"));
const NoSymbolsPassword = lazy(() => import("@/pages/tools/NoSymbolsPassword"));
const LettersOnlyPassword = lazy(() => import("@/pages/tools/LettersOnlyPassword"));
const PinGenerator = lazy(() => import("@/pages/tools/PinGenerator"));
const PasswordStrength = lazy(() => import("@/pages/tools/PasswordStrength"));
const BackupCodes = lazy(() => import("@/pages/tools/BackupCodes"));
const RecoveryKey = lazy(() => import("@/pages/tools/RecoveryKey"));
const TemporaryPassword = lazy(() => import("@/pages/tools/TemporaryPassword"));
const WifiPassword = lazy(() => import("@/pages/tools/WifiPassword"));
const ApiKey = lazy(() => import("@/pages/tools/ApiKey"));
const JwtSecret = lazy(() => import("@/pages/tools/JwtSecret"));
const UuidGenerator = lazy(() => import("@/pages/tools/UuidGenerator"));
const RandomString = lazy(() => import("@/pages/tools/RandomString"));
const TotpSecret = lazy(() => import("@/pages/tools/TotpSecret"));
const TestCard = lazy(() => import("@/pages/tools/TestCard"));
const DjangoSecret = lazy(() => import("@/pages/tools/DjangoSecret"));
const LaravelAppKey = lazy(() => import("@/pages/tools/LaravelAppKey"));
const FlaskSecret = lazy(() => import("@/pages/tools/FlaskSecret"));
const WordPressSalts = lazy(() => import("@/pages/tools/WordPressSalts"));
const EncryptionKey = lazy(() => import("@/pages/tools/EncryptionKey"));
const AesKey = lazy(() => import("@/pages/tools/AesKey"));
const RsaKey = lazy(() => import("@/pages/tools/RsaKey"));
const HmacKey = lazy(() => import("@/pages/tools/HmacKey"));
const HashGenerator = lazy(() => import("@/pages/tools/HashGenerator"));
const SaltGenerator = lazy(() => import("@/pages/tools/SaltGenerator"));
const SshKey = lazy(() => import("@/pages/tools/SshKey"));
const PgpGpg = lazy(() => import("@/pages/tools/PgpGpg"));
const WireguardKey = lazy(() => import("@/pages/tools/WireguardKey"));
const VapidKey = lazy(() => import("@/pages/tools/VapidKey"));
const SecretKey = lazy(() => import("@/pages/tools/SecretKey"));
const UsernameGenerator = lazy(() => import("@/pages/tools/UsernameGenerator"));
const SecurityGuides = lazy(() => import("@/pages/tools/SecurityGuides"));

function ToolSuspense({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading tool">
          <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded-md bg-muted animate-pulse" />
          <div className="h-64 rounded-lg bg-muted animate-pulse" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },

      // PASSWORDS
      { path: "tools/password", element: <ToolSuspense><PasswordGenerator /></ToolSuspense> },
      { path: "tools/passphrase", element: <ToolSuspense><PassphraseGenerator /></ToolSuspense> },
      { path: "tools/pronounceable-password", element: <ToolSuspense><PronounceablePassword /></ToolSuspense> },
      { path: "tools/memorable-password", element: <ToolSuspense><MemorablePassword /></ToolSuspense> },
      { path: "tools/master-password", element: <ToolSuspense><MasterPassword /></ToolSuspense> },
      { path: "tools/bulk-password", element: <ToolSuspense><BulkPassword /></ToolSuspense> },
      { path: "tools/password-presets", element: <ToolSuspense><PasswordPresets /></ToolSuspense> },
      { path: "tools/8-char-password", element: <ToolSuspense><EightCharPassword /></ToolSuspense> },
      { path: "tools/16-char-password", element: <ToolSuspense><SixteenCharPassword /></ToolSuspense> },
      { path: "tools/no-symbols-password", element: <ToolSuspense><NoSymbolsPassword /></ToolSuspense> },
      { path: "tools/letters-only-password", element: <ToolSuspense><LettersOnlyPassword /></ToolSuspense> },
      { path: "tools/pin", element: <ToolSuspense><PinGenerator /></ToolSuspense> },
      { path: "tools/password-strength", element: <ToolSuspense><PasswordStrength /></ToolSuspense> },

      // RECOVERY
      { path: "tools/backup-codes", element: <ToolSuspense><BackupCodes /></ToolSuspense> },
      { path: "tools/recovery-key", element: <ToolSuspense><RecoveryKey /></ToolSuspense> },
      { path: "tools/temporary-password", element: <ToolSuspense><TemporaryPassword /></ToolSuspense> },

      // HOME/GAMING
      { path: "tools/wifi-password", element: <ToolSuspense><WifiPassword /></ToolSuspense> },

      // DEVELOPER
      { path: "tools/api-key", element: <ToolSuspense><ApiKey /></ToolSuspense> },
      { path: "tools/jwt-secret", element: <ToolSuspense><JwtSecret /></ToolSuspense> },
      { path: "tools/uuid", element: <ToolSuspense><UuidGenerator /></ToolSuspense> },
      { path: "tools/random-string", element: <ToolSuspense><RandomString /></ToolSuspense> },
      { path: "tools/totp-2fa", element: <ToolSuspense><TotpSecret /></ToolSuspense> },
      { path: "tools/test-card", element: <ToolSuspense><TestCard /></ToolSuspense> },

      // FRAMEWORKS
      { path: "tools/django-secret", element: <ToolSuspense><DjangoSecret /></ToolSuspense> },
      { path: "tools/laravel-app-key", element: <ToolSuspense><LaravelAppKey /></ToolSuspense> },
      { path: "tools/flask-secret", element: <ToolSuspense><FlaskSecret /></ToolSuspense> },
      { path: "tools/wordpress-salts", element: <ToolSuspense><WordPressSalts /></ToolSuspense> },

      // ENCRYPTION
      { path: "tools/encryption-key", element: <ToolSuspense><EncryptionKey /></ToolSuspense> },
      { path: "tools/aes-key", element: <ToolSuspense><AesKey /></ToolSuspense> },
      { path: "tools/rsa-key", element: <ToolSuspense><RsaKey /></ToolSuspense> },
      { path: "tools/hmac-key", element: <ToolSuspense><HmacKey /></ToolSuspense> },
      { path: "tools/hash-generator", element: <ToolSuspense><HashGenerator /></ToolSuspense> },
      { path: "tools/salt-generator", element: <ToolSuspense><SaltGenerator /></ToolSuspense> },

      // ADVANCED
      { path: "tools/ssh-key", element: <ToolSuspense><SshKey /></ToolSuspense> },
      { path: "tools/pgp-gpg", element: <ToolSuspense><PgpGpg /></ToolSuspense> },
      { path: "tools/wireguard-key", element: <ToolSuspense><WireguardKey /></ToolSuspense> },
      { path: "tools/vapid-key", element: <ToolSuspense><VapidKey /></ToolSuspense> },
      { path: "tools/secret-key", element: <ToolSuspense><SecretKey /></ToolSuspense> },

      // USERNAME
      { path: "tools/username-generator", element: <ToolSuspense><UsernameGenerator /></ToolSuspense> },

      // EDUCATION
      { path: "tools/security-guides", element: <ToolSuspense><SecurityGuides /></ToolSuspense> },

      // INFO PAGES
      { path: "privacy", element: <ToolSuspense><PrivacyPage /></ToolSuspense> },
      { path: "about", element: <ToolSuspense><AboutPage /></ToolSuspense> },
    ],
  },
]);

export function AppRouter(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
