// vite.config.ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*"],
      manifest: {
        name: "MyAR.in",
        short_name: "MyAR.in",
        description:
          "Assamese audiobooks and eBooks on Grantha Katha – your destination for Assamese literature, articles, and newsletters. Immerse yourself in Assam’s literary heritage!",
        theme_color: "#6257a5",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/pwa-192-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/pwa-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,ttf,woff,json}"],
      },
    }),
  ],

  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
  },
});
