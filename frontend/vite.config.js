import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:8000\/navigation\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "navigation-api",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: /^http:\/\/localhost:8000\/chatbot/,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "Campus AR Navigation",
        short_name: "CampusNav",
        description: "AI-powered AR campus navigation system",
        theme_color: "#1a1a2e",
        background_color: "#1a1a2e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
});
