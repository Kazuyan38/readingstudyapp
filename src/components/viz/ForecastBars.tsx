interface ForecastBarsProps {
  counts: number[] // 今後 N 日、各日の復習予定枚数
}

export function ForecastBars({ counts }: ForecastBarsProps) {
  const max = Math.max(1, ...counts)
  return (
    <div className="flex h-24 items-end gap-1">
      {counts.map((c, i) => (
        <div
          key={i}
          title={`${i + 1}日後: ${c}枚`}
          className="flex-1 rounded-t bg-(--accent) transition-all duration-500"
          style={{ height: `${(c / max) * 100}%`, opacity: 0.4 + 0.6 * (c / max) }}
        />
      ))}
    </div>
  )
}
