const DAY_MS = 24 * 60 * 60 * 1000
const WEEKS = 18

/** 直近 18 週間の復習活動ヒートマップ。GitHub の草に似た形式。 */
export function Heatmap({ reviewedAtList }: { reviewedAtList: number[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMs = today.getTime()

  const counts = new Map<number, number>()
  for (const t of reviewedAtList) {
    const day = new Date(t)
    day.setHours(0, 0, 0, 0)
    const key = day.getTime()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const totalDays = WEEKS * 7
  // 直近日が右下に来るよう、日曜始まりの列（週）でグリッドを組む
  const todayDow = today.getDay()
  const startMs = todayMs - (totalDays - 1 - todayDow) * DAY_MS

  const cells: { date: number; count: number }[] = []
  for (let i = 0; i < totalDays; i++) {
    const date = startMs + i * DAY_MS
    cells.push({ date, count: counts.get(date) ?? 0 })
  }

  const max = Math.max(1, ...cells.map((c) => c.count))

  function opacityFor(count: number) {
    if (count === 0) return 0.08
    return 0.25 + 0.75 * (count / max)
  }

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
      {cells.map((cell) => (
        <div
          key={cell.date}
          title={`${new Date(cell.date).toLocaleDateString('ja-JP')}: ${cell.count}枚`}
          className="h-3 w-3 rounded-sm bg-(--accent) transition-opacity duration-500"
          style={{ opacity: cell.date > todayMs ? 0 : opacityFor(cell.count) }}
        />
      ))}
    </div>
  )
}
