import { useMemo } from 'react'
import { Task, TaskCategory, CATEGORY_LABEL } from '../types/task'

interface DayTimelineProps {
  tasks: Task[]
  date:  Date
}

const CAT_COLOR: Record<TaskCategory, string> = {
  work:      '#5865f2',
  personal:  '#23a55a',
  health:    '#f97316',
  leisure:   '#9b59b6',
  household: '#f1c40f',
  food:      '#eb459e',
  hygiene:   '#1abc9c',
  other:     '#80848e',
}

const TOTAL_MIN     = 1440
const SVG_SIZE      = 248
const CX            = SVG_SIZE / 2
const CY            = SVG_SIZE / 2
const RADIUS        = 96
const STROKE_W      = 28
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP_DEG       = 1.0

function fmtDuration(minutes: number): string {
  if (minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function DayTimeline({ tasks }: DayTimelineProps) {
  const { segments, usedMin, freeMin } = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'skipped')

    const catMap = new Map<TaskCategory, number>()
    active.forEach(t => {
      catMap.set(t.category, (catMap.get(t.category) ?? 0) + t.timeLimitMinutes)
    })

    const segments = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, min]) => ({
        category: cat as TaskCategory,
        color:    CAT_COLOR[cat as TaskCategory],
        label:    CATEGORY_LABEL[cat as TaskCategory],
        minutes:  min,
      }))

    const usedMin = segments.reduce((s, seg) => s + seg.minutes, 0)
    const freeMin = Math.max(0, TOTAL_MIN - usedMin)
    return { segments, usedMin, freeMin }
  }, [tasks])

  let accumulated = 0
  const arcs = segments.map(seg => {
    const gapMin     = (GAP_DEG / 360) * TOTAL_MIN
    const arcLen     = Math.max(0, (Math.max(0, seg.minutes - gapMin) / TOTAL_MIN) * CIRCUMFERENCE)
    const startAngle = (accumulated / TOTAL_MIN) * 360 - 90
    accumulated += seg.minutes
    return { ...seg, arcLen, startAngle }
  })

  const freeColor = freeMin <= 120 ? '#ef4444'
                  : freeMin <= 240 ? '#f59e0b'
                  : '#23a55a'

  const freeLbl = (() => {
    const h = Math.floor(freeMin / 60)
    const m = freeMin % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  })()

  return (
    <div className="flex flex-col items-center gap-5 py-4">

      {/* ── Donut ── */}
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg width={SVG_SIZE} height={SVG_SIZE}
             viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
          {/* Track */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="none"
            stroke="var(--c-hover)" strokeWidth={STROKE_W} />

          {/* Arcs */}
          {arcs.map((arc, i) => (
            <circle key={i}
              cx={CX} cy={CY} r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE_W}
              strokeLinecap="butt"
              strokeDasharray={`${arc.arcLen} ${CIRCUMFERENCE - arc.arcLen}`}
              strokeDashoffset={0}
              transform={`rotate(${arc.startAngle} ${CX} ${CY})`}
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none">
          <span className="text-4xl font-extrabold leading-none"
                style={{ color: freeColor }}>
            {freeLbl}
          </span>
          <span className="text-sm font-medium leading-none"
                style={{ color: 'var(--c-muted)' }}>
            livres
          </span>
          <span className="text-xs leading-none mt-0.5"
                style={{ color: 'var(--c-border)' }}>
            de 24h
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {segments.map(seg => (
          <div key={seg.category} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                 style={{ backgroundColor: seg.color }} />
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
              {seg.label}
            </span>
            <span className="text-xs font-semibold tabular-nums"
                  style={{ color: 'var(--c-soft)' }}>
              {fmtDuration(seg.minutes)}
            </span>
          </div>
        ))}

        {segments.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                 style={{ border: '1.5px solid var(--c-border)' }} />
            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Livre</span>
            <span className="text-xs font-semibold tabular-nums"
                  style={{ color: freeColor }}>
              {fmtDuration(freeMin)}
            </span>
          </div>
        )}

        {segments.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
            Adicione tarefas para ver a distribuição
          </p>
        )}
      </div>

      {usedMin > TOTAL_MIN && (
        <p className="text-xs text-amber-500">⚠ Tarefas somam mais de 24h.</p>
      )}
    </div>
  )
}
