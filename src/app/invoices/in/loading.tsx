export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-[var(--primary-soft)] rounded-xl mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
        <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
        <div className="h-24 bg-[var(--primary-soft)]/60 rounded-2xl" />
      </div>
      <div className="h-11 w-full max-w-md bg-[var(--primary-soft)]/60 rounded-2xl mb-5" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-[var(--primary-soft)]/40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
