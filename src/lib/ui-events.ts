// Mở modal thao tác nhanh từ bất kỳ đâu (FAB) — không cần điều hướng trang.
export type QuickModal = "invoice" | "revenue";

const EVT = "erp:quickmodal";

export function openQuickModal(m: QuickModal) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT, { detail: m }));
  }
}

export function onQuickModal(handler: (m: QuickModal) => void) {
  const h = (e: Event) => handler((e as CustomEvent).detail as QuickModal);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
