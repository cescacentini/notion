interface ForecastDay {
  date: string;
  label: string;
  count: number;
}

interface Props {
  forecast: ForecastDay[];
}

export default function Forecast({ forecast }: Props) {
  const max = Math.max(...forecast.map((d) => d.count), 1);

  return (
    <div className="flex gap-2 items-end h-16">
      {forecast.map((day, i) => {
        const pct = max > 0 ? (day.count / max) * 100 : 0;
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-neutral-500 font-medium tabular-nums">
              {day.count > 0 ? day.count : ""}
            </span>
            <div className="w-full flex items-end" style={{ height: 32 }}>
              <div
                className={`w-full rounded-sm transition-all ${
                  i === 0 ? "bg-neutral-900" : "bg-neutral-200"
                }`}
                style={{ height: `${Math.max(pct, day.count > 0 ? 15 : 4)}%` }}
              />
            </div>
            <span className={`text-[10px] ${i === 0 ? "font-semibold text-neutral-900" : "text-neutral-400"}`}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
