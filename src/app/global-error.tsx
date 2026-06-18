"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 420, margin: "15vh auto" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Ứng dụng gặp sự cố</h2>
          <p style={{ color: "#666", marginBottom: 20 }}>
            Đã xảy ra lỗi nghiêm trọng. Vui lòng tải lại trang.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>Mã lỗi: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "10px 20px",
              borderRadius: 14,
              background: "#5B4FCF",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  );
}
