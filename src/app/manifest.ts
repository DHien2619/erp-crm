import type { MetadataRoute } from "next";

// Web App Manifest — Next.js App Router tự phục vụ tại /manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ERP-CRM · AIECOS",
    short_name: "ERP AIECOS",
    description:
      "Quản trị tài chính: gap hoá đơn đầu vào, công nợ, dự báo & chiến lược.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef0fb",
    theme_color: "#5b4fcf",
    lang: "vi",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
