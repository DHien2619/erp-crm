"use client";

import { useEffect, useState } from "react";
import { Building2, Percent, Wallet, Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Topbar } from "@/components/topbar";
import {
  loadSettings,
  saveSettings,
  defaultSettings,
  type AppSettings,
} from "@/lib/settings";

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(loadSettings());
  }, []);

  function update<K extends keyof AppSettings>(k: K, v: AppSettings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  function onSave() {
    saveSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell>
      <Topbar
        title="Cài đặt"
        subtitle="Thông tin công ty & tham số tài chính"
        action={
          <button
            onClick={onSave}
            className="h-11 px-5 rounded-2xl bg-[var(--primary)] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[var(--primary-deep)] transition-colors shadow-md shadow-[var(--primary)]/25"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Đã lưu" : "Lưu cài đặt"}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-soft p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Thông tin công ty</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tên công ty" className="col-span-2">
              <input className="erp-input" value={s.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </Field>
            <Field label="Mã số thuế">
              <input className="erp-input" value={s.taxCode} onChange={(e) => update("taxCode", e.target.value)} />
            </Field>
            <Field label="Số điện thoại">
              <input className="erp-input" value={s.phone} onChange={(e) => update("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="erp-input" value={s.email} onChange={(e) => update("email", e.target.value)} />
            </Field>
            <Field label="Địa chỉ">
              <input className="erp-input" value={s.address} onChange={(e) => update("address", e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-5">
            <Percent className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-bold text-[var(--foreground)]">Tham số tài chính</h3>
          </div>
          <div className="flex flex-col gap-4">
            <Field label="Thuế suất TNDN (%)">
              <input type="number" className="erp-input" value={s.citRate} onChange={(e) => update("citRate", Number(e.target.value))} />
            </Field>
            <Field label="VAT mặc định (%)">
              <input type="number" className="erp-input" value={s.defaultVat} onChange={(e) => update("defaultVat", Number(e.target.value))} />
            </Field>
            <Field label="Tiền mặt đầu kỳ (triệu)">
              <input type="number" className="erp-input" value={s.startCash} onChange={(e) => update("startCash", Number(e.target.value))} />
            </Field>
            <div className="flex items-start gap-2 p-3 bg-[var(--primary-soft)]/50 rounded-2xl mt-1">
              <Wallet className="w-4 h-4 text-[var(--primary)] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Các tham số này dùng cho trang Báo cáo (thuế tiết kiệm) và Dự báo (số dư đầu kỳ).
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--muted-soft)] mt-4">
        Cài đặt được lưu trên trình duyệt này. (Đồng bộ đa thiết bị sẽ thêm khi bật đăng nhập.)
      </p>
    </AppShell>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
