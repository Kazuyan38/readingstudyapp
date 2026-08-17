import type { InsightCard } from '../db/schema'

/** 今日の復習キューを構築する（docs/DESIGN.md §3.4 一日の負荷制御）。 */
export function buildTodayQueue(
  dueCards: InsightCard[],
  dailyReviewLimit: number
): { queue: InsightCard[]; deferred: number } {
  const sorted = [...dueCards].sort((a, b) => a.dueAt - b.dueAt)
  const queue = sorted.slice(0, dailyReviewLimit)
  const deferred = Math.max(0, sorted.length - dailyReviewLimit)
  return { queue, deferred }
}
