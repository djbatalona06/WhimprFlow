import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// WhimprFlow PWA — installable phone companion. Single-page app served from the
// same origin as the /api serverless functions, so no CORS. The service worker
// (Workbox, auto-generated) precaches the app shell for offline launch and
// instant re-open; the /api calls are network-only (never cached).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon.png", "icons/apple-touch-icon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Never cache the backend; dictation must always hit the network.
            urlPattern: /\/api\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "WhimprFlow",
        short_name: "WhimprFlow",
        description:
          "Record, clean up your voice with AI, and send it to Notes, Obsidian, or your automations.",
        theme_color: "#0C0E12",
        background_color: "#0C0E12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2020",
  },
});
