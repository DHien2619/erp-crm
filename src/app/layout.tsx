import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { RoleProvider } from "@/components/role-provider";
import { getCurrentUser } from "@/lib/auth";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ERP-CRM · AIECOS",
  description: "Internal tool quản lý gap hoá đơn đầu vào và đối soát chi phí",
  manifest: "/manifest.webmanifest",
  applicationName: "ERP AIECOS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP AIECOS",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#5b4fcf",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="vi" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <RoleProvider user={user}>{children}</RoleProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
