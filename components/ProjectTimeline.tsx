import type { Project } from "@/lib/notion";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const QUARTER_MONTHS = ["Jan", "Apr", "Jul", "Oct"];

function pct(dateStr: string, year: number): number {
  const d = new Date(dateStr);
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return Math.max(0, Math.min(100, ((d.getTime() - start) / (end - start)) * 100));
}

const BAR_COLORS = [
  "bg-neutral-900",
  "bg-neutral-600",
  "bg-neutral-400",
  "bg-neutral-300",
];

export default function ProjectTimeline({ projects }: { projects: Project[] }) {
  const year = new Date().getFullYear();
  const todayPct = pct(new Date().toISOString(), year);

  const withDates = projects.filter((p) => p.startDate);
  if (withDates.length === 0) return null;

  return (
    <div className="border border-neutral-100 rounded-xl px-4 py-4">
      <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium mb-4">{year}</p>

      {/* Quarter headers */}
      <div className="grid grid-cols-4 mb-2">
        {QUARTERS.map((q, i) => (
          <div key={q} className="flex flex-col">
            <span className="text-[10px] font-semibold text-neutral-500">{q}</span>
            <span className="text-[9px] text-neutral-300">{QUARTER_MONTHS[i]}</span>
          </div>
        ))}
      </div>

      {/* Timeline track */}
      <div className="relative">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-l border-neutral-100 h-full" />
          ))}
        </div>

        {/* Project bars */}
        <div className="flex flex-col gap-1.5 relative z-10">
          {withDates.map((project, idx) => {
            const s = pct(project.startDate!, year);
            const e = project.endDate ? pct(project.endDate, year) : Math.min(s + 8, 100);
            const width = Math.max(e - s, 3);

            return (
              <div key={project.id} className="relative h-6 w-full">
                <div
                  className={`absolute h-full rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]} flex items-center px-2 overflow-hidden`}
                  style={{ left: `${s}%`, width: `${width}%`, minWidth: "24px" }}
                  title={project.name}
                >
                  <span className="text-[9px] font-medium text-white truncate leading-none whitespace-nowrap">
                    {project.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-400 z-20 pointer-events-none"
          style={{ left: `${todayPct}%` }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 -translate-x-[2px] -translate-y-1" />
        </div>
      </div>
    </div>
  );
}
