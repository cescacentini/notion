export default function Loading() {
  return (
    <div className="min-h-full max-w-xl mx-auto px-5 py-8 flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 bg-neutral-100 rounded" />
          <div className="h-6 w-52 bg-neutral-100 rounded" />
        </div>
        <div className="w-6 h-6 bg-neutral-100 rounded" />
      </div>
      <div className="h-32 bg-neutral-100 rounded-2xl" />
      <div className="grid grid-cols-3 gap-y-7 gap-x-4 px-4 py-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-neutral-100" />
            <div className="h-3 w-12 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
