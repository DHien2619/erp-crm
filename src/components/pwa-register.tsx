"use client";

import { useEffect } from "react";

// Đăng ký service worker để app cài được (PWA) + offline cơ bản.
// Chỉ chạy ở production để không cản trở HMR khi `npm run dev`.
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW register failed:", err));
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
