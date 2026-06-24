import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--primary-soft)]/30">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary)] text-white font-extrabold text-2xl flex items-center justify-center mx-auto mb-3">
            E
          </div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">ERP-CRM · AIECOS</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Đăng nhập để tiếp tục</p>
        </div>
        <div className="card-soft p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-[var(--muted)] mt-4">
          Chưa có tài khoản? Liên hệ quản trị viên để được cấp.
        </p>
      </div>
    </div>
  );
}
