/**
 * ハイブリッド SM-2 スケジューラ（docs/DESIGN.md §3.2）。
 * 純粋関数として実装する — 副作用なし。同期の競合解決（replay.ts）が
 * この関数を ReviewLog から繰り返し呼ぶことで SRS 状態を再構築できる。
 */

export type CardState = 'learning' | 'review' | 'suspended'
export type ReviewQuality = 1 | 3 | 4 | 5

export interface SrsState {
  state: CardState
  stepIndex: number
  easeFactor: number
  interval: number // 日数
  repetitions: number
  lapses: number
  dueAt: number // epoch ms
  lastReviewedAt: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const MIN_EASE = 1.3
const DEFAULT_LEARNING_STEPS_MIN = [10, 1440, 4320] // 10分後 → 翌日 → 3日後
const EASY_BONUS = 1.3
const JITTER_RANGE = 0.05

export function initialSrsState(now: number): SrsState {
  return {
    state: 'learning',
    stepIndex: 0,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
  }
}

/**
 * deterministic な擬似ジッタ。同じ入力なら同じ結果を返す（テスト可能・再生可能にするため
 * Math.random は使わない）。cardId と reviewedAt から決定する。
 */
function jitterFor(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  const unit = (h >>> 0) / 0xffffffff // 0..1
  return (unit * 2 - 1) * JITTER_RANGE // -0.05..0.05
}

export interface ApplyReviewInput {
  state: SrsState
  quality: ReviewQuality
  reviewedAt: number
  seed: string // ジッタの決定に使う（例: cardId + reviewedAt）
  learningStepsMinutes?: number[]
}

export interface ApplyReviewResult {
  state: SrsState
  elapsedDays: number
  scheduledDays: number
}

/** 1 回の復習を状態に適用する。学習ステップ中と卒業後の SM-2 で分岐する。 */
export function applyReview(input: ApplyReviewInput): ApplyReviewResult {
  const { quality, reviewedAt, seed } = input
  const steps = input.learningStepsMinutes ?? DEFAULT_LEARNING_STEPS_MIN
  const prev = input.state

  const elapsedDays = prev.lastReviewedAt ? (reviewedAt - prev.lastReviewedAt) / DAY_MS : 0
  const scheduledDaysBefore = prev.interval

  if (prev.state === 'learning') {
    return applyLearningStep(prev, quality, reviewedAt, seed, steps, elapsedDays, scheduledDaysBefore)
  }
  return applySm2(prev, quality, reviewedAt, seed, elapsedDays, scheduledDaysBefore)
}

function withJitter(days: number, seed: string): number {
  const jittered = days * (1 + jitterFor(seed))
  return Math.max(days > 0 ? 1 / 24 : 0, jittered)
}

function applyLearningStep(
  prev: SrsState,
  quality: ReviewQuality,
  reviewedAt: number,
  seed: string,
  stepsMin: number[],
  elapsedDays: number,
  scheduledDaysBefore: number
): ApplyReviewResult {
  if (quality < 3) {
    // 忘れた: 最初のステップに戻す
    const dueAt = reviewedAt + (stepsMin[0] * 60_000)
    return {
      state: {
        ...prev,
        stepIndex: 0,
        repetitions: 0,
        lapses: prev.lapses + 1,
        dueAt,
        lastReviewedAt: reviewedAt,
      },
      elapsedDays,
      scheduledDays: scheduledDaysBefore,
    }
  }

  const nextStepIndex = prev.stepIndex + 1
  if (nextStepIndex >= stepsMin.length) {
    // 卒業 → SM-2 へ
    const interval = 1
    const dueAt = reviewedAt + withJitter(interval, seed) * DAY_MS
    return {
      state: {
        ...prev,
        state: 'review',
        stepIndex: 0,
        repetitions: 1,
        interval,
        dueAt,
        lastReviewedAt: reviewedAt,
      },
      elapsedDays,
      scheduledDays: scheduledDaysBefore,
    }
  }

  const dueAt = reviewedAt + stepsMin[nextStepIndex] * 60_000
  return {
    state: { ...prev, stepIndex: nextStepIndex, dueAt, lastReviewedAt: reviewedAt },
    elapsedDays,
    scheduledDays: scheduledDaysBefore,
  }
}

function applySm2(
  prev: SrsState,
  quality: ReviewQuality,
  reviewedAt: number,
  seed: string,
  elapsedDays: number,
  scheduledDaysBefore: number
): ApplyReviewResult {
  const q = quality
  let easeFactor = prev.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = Math.max(MIN_EASE, easeFactor)

  if (q < 3) {
    const interval = 1
    const dueAt = reviewedAt + withJitter(interval, seed) * DAY_MS
    return {
      state: {
        ...prev,
        easeFactor,
        repetitions: 0,
        lapses: prev.lapses + 1,
        interval,
        dueAt,
        lastReviewedAt: reviewedAt,
      },
      elapsedDays,
      scheduledDays: scheduledDaysBefore,
    }
  }

  const repetitions = prev.repetitions + 1
  let interval: number
  if (prev.repetitions === 0) {
    interval = 1
  } else if (prev.repetitions === 1) {
    interval = 6
  } else {
    interval = Math.round(prev.interval * easeFactor)
  }
  if (q === 5) {
    interval = Math.round(interval * EASY_BONUS)
  }

  const dueAt = reviewedAt + withJitter(interval, seed) * DAY_MS
  return {
    state: { ...prev, easeFactor, repetitions, interval, dueAt, lastReviewedAt: reviewedAt },
    elapsedDays,
    scheduledDays: scheduledDaysBefore,
  }
}
