"use client";

interface Props {
  data: Record<string, number>;
  weeks?: number;
}

function colorForCount(n: number): string {
  if (n === 0) return "bg-neutral-100";
  if (n <= 2) return "bg-neutral-300";
  if (n <= 5) return "bg-neutral-500";
  if (n <= 10) return "bg-neutral-700";
  return "bg-neutral-900";
}

// Pure UTC date helpers — no local timezone involved
function utcToday(): string {
  return new Date().toISOString().split("T")[0];
}

function utcAddDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC avoids any boundary issues
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function utcGetDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCDay();
}

function utcGetMonth(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCMonth();
}

export default function Heatmap({ data, weeks = 26 }: Props) {
  const todayKey = utcToday();
  const dayOfWeek = utcGetDayOfWeek(todayKey); // 0=Sun

  // End on the Saturday of the current week
  const endSat = utcAddDays(todayKey, 6 - dayOfWeek);

  // Start date: weeks*7 days before endSat
  const totalDays = weeks * 7;
  const startDate = utcAddDays(endSat, -(totalDays - 1));

  // Build flat list of cells
  const cells: { date: string; count: number; isFuture: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const key = utcAddDays(startDate, i);
    cells.push({ date: key, count: data[key] ?? 0, isFuture: key > todayKey });
  }

  // Split into columns of 7
  const columns: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(cells.slice(w * 7, w * 7 + 7));
  }

  // Month labels: show month name at first column of each new month
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  columns.forEach((col, ci) => {
    const first = col[0];
    if (!first) return;
    const m = utcGetMonth(first.date);
    if (m !== lastMonth) {
      monthLabels.push({
        label: new Date(first.date + "T12:00:00Z").toLocaleDateString("en", { month: "short", timeZone: "UTC" }),
        col: ci,
      });
      lastMonth = m;
    }
  });

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="inline-flex flex-col gap-1 min-w-max px-1">
        {/* Month labels */}
        <div className="flex gap-1">
          {columns.map((_, ci) => {
            const lbl = monthLabels.find((m) => m.col === ci);
            return (
              <div key={ci} className="w-3 text-[9px] text-neutral-400 leading-none">
                {lbl?.label ?? ""}
              </div>
            );
          })}
        </div>

        {/* Grid rows */}
        {[0, 1, 2, 3, 4, 5, 6].map((row) => (
          <div key={row} className="flex gap-1">
            {columns.map((col, ci) => {
              const cell = col[row];
              if (!cell) return <div key={ci} className="w-3 h-3" />;
              return (
                <div
                  key={ci}
                  title={`${cell.date}: ${cell.count} reviewed`}
                  className={`w-3 h-3 rounded-sm transition-colors ${
                    cell.isFuture ? "bg-neutral-50" : colorForCount(cell.count)
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
