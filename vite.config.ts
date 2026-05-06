import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const domain = (env["VITE_PUBLIC_DOMAIN"] ?? "https://www.randomkey.online").replace(/\/+$/, "");

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["fonts/**/*", "icons/**/*"],
        manifest: {
          name: "randomkey.online — Secure Secret & Key Generator",
          short_name: "randomkey",
          description: "Privacy-first browser-based secret and key generator.",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          navigateFallback: "/index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\./,
              handler: "CacheFirst",
              options: {
                cacheName: "fonts-cache",
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __APP_DOMAIN__: JSON.stringify(domain),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "cmdk"],
            motion: ["framer-motion"],
          },
        },
      },
    },
    server: {
      port: 5173,
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/vitest.setup.ts"],
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    },
  };
});
