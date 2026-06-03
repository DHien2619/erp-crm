export type AppSettings = {
  companyName: string;
  taxCode: string;
  address: string;
  email: string;
  phone: string;
  citRate: number; // % thuế TNDN
  defaultVat: number; // % VAT mặc định
  startCash: number; // triệu — số dư tiền mặt đầu kỳ (cho dự báo)
};

export const defaultSettings: AppSettings = {
  companyName: "Công ty Cổ phần Công nghệ AIECOS",
  taxCode: "",
  address: "",
  email: "",
  phone: "",
  citRate: 20,
  defaultVat: 10,
  startCash: -26,
};

const KEY = "erp-crm-settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
