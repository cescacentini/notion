export default function Loading() {
  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6 animate-pulse">
      <div className="h-6 w-24 bg-neutral-100 rounded" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
