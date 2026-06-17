export default function Loading() {
  return (
    <div className="min-h-screen lg:flex">
      {/* dải sidebar tím (giữ nguyên cảm giác liền mạch) */}
      <div className="hidden lg:block relative w-[102px] shrink-0">
        <div className="absolute inset-y-3 left-3 w-[78px] card-primary rounded-[28px]" />
      </div>

      <div className="flex-1 p-3 lg:py-4 lg:pr-4 lg:pl-0">
        <div className="card-soft p-4 lg:p-6 min-h-[85vh]">
          <div className="animate-pulse">
            <div className="h-8 w-44 bg-[var(--primary-soft)] rounded-xl mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
              <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
              <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
            </div>
            <div className="h-72 bg-[var(--primary-soft)]/40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
