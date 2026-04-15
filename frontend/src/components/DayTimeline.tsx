import { useMemo, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Task, TaskCategory, CATEGORY_LABEL } from '../types/task'
import { isToday } from 'date-fns'

interface DayTimelineProps {
  tasks: Task[]
  date: Date
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

const TOTAL_MIN = 1440

function toMin(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

function fmtDuration(minutes: number): string {
  if (minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function DayTimeline({ tasks, date }: DayTimelineProps) {
  const [nowMin, setNowMin] = useState<number | null>(null)

  // Update "now" indicator every minute
  useEffect(() => {
    if (!isToday(date)) { setNowMin(null); return }
    const update = () => setNowMin(toMin(new Date()))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [date])

  const { scheduled, unscheduled, usedMin, freeMin, catTotals } = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'skipped')
    const scheduled = active
      .filter(t => t.scheduledAt)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    const unscheduled = active.filter(t => !t.scheduledAt)
    const usedMin = active.reduce((s, t) => s + t.timeLimitMinutes, 0)
    const freeMin = Math.max(0, TOTAL_MIN - usedMin)

    // minutes per category (scheduled only — shown in timeline)
    const catTotals: Partial<Record<TaskCategory, number>> = {}
    scheduled.forEach(t => {
      catTotals[t.category] = (catTotals[t.category] ?? 0) + t.timeLimitMinutes
    })
    return { scheduled, unscheduled, usedMin, freeMin, catTotals }
  }, [tasks])

  const freeColor = freeMin <= 120 ? '#ef4444'
                  : freeMin <= 240 ? '#f59e0b'
                  : '#23a55a'

  const overloaded = usedMin > TOTAL_MIN

  return (
    <div className="card space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={13} className="text-primary-500" />
          <span className="text-xs font-semibold" style={{ color: 'var(--c-soft)' }}>
            Horas do dia
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--c-muted)' }}>
            {fmtDuration(usedMin)} em tarefas
          </span>
          <span style={{ color: 'var(--c-border)' }}>·</span>
          <span className="font-semibold" style={{ color: freeColor }}>
            {fmtDuration(freeMin)} livres
          </span>
        </div>
      </div>

      {/* ── Free time big bar ── */}
      <div className="space-y-1.5">
        {/* Simple used/free split bar */}
        <div className="h-2 rounded-full overflow-hidden"
             style={{ backgroundColor: 'var(--c-hover)' }}>
          <div className="h-full rounded-full transition-all duration-700"
               style={{
                 width: `${Math.min(100, (usedMin / TOTAL_MIN) * 100)}%`,
                 backgroundColor: overloaded ? '#ef4444' : '#5865f2',
               }} />
        </div>
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--c-muted)' }}>
          <span>0%</span>
          <span>{Math.round((usedMin / TOTAL_MIN) * 100)}% ocupado</span>
          <span>100%</span>
        </div>
      </div>

      {/* ── 24h timeline ── */}
      <div className="space-y-1">
        {/* Hour labels */}
        <div className="flex justify-between text-[10px] select-none"
             style={{ color: 'var(--c-muted)' }}>
          {['0h', '6h', '12h', '18h', '24h'].map(h => (
            <span key={h}>{h}</span>
          ))}
        </div>

        {/* Timeline track */}
        <div className="relative h-8 rounded-lg overflow-hidden"
             style={{ backgroundColor: 'var(--c-hover)' }}>

          {/* Vertical dividers at 6h, 12h, 18h */}
          {[6, 12, 18].map(h => (
            <div key={h}
              className="absolute top-0 h-full w-px pointer-events-none"
              style={{
                left: `${(h * 60 / TOTAL_MIN) * 100}%`,
                backgroundColor: 'var(--c-border)',
              }} />
          ))}

          {/* Task blocks */}
          {scheduled.map(task => {
            const start = toMin(new Date(task.scheduledAt!))
            const dur   = Math.min(task.timeLimitMinutes, TOTAL_MIN - start)
            const left  = (start / TOTAL_MIN) * 100
            const width = Math.max((dur / TOTAL_MIN) * 100, 0.4) // min visible width

            return (
              <div key={task.id}
                title={`${task.title} (${fmtDuration(task.timeLimitMinutes)})`}
                className="absolute top-0 h-full cursor-default"
                style={{
                  left:            `${left}%`,
                  width:           `${width}%`,
                  backgroundColor: CAT_COLOR[task.category],
                  opacity:         task.status === 'completed' ? 0.35 : 0.85,
                  borderRight:     '1px solid rgba(0,0,0,0.12)',
                }} />
            )
          })}

          {/* Now indicator */}
          {nowMin !== null && (
            <div className="absolute top-0 h-full w-0.5 z-10 pointer-events-none"
                 style={{
                   left:            `${(nowMin / TOTAL_MIN) * 100}%`,
                   backgroundColor: 'rgba(255,255,255,0.9)',
                   boxShadow:       '0 0 4px rgba(255,255,255,0.6)',
                 }} />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Category legend (scheduled tasks only) */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {(Object.entries(catTotals) as [TaskCategory, number][]).map(([cat, min]) => (
            <div key={cat} className="flex items-center gap-1.5 text-[11px]"
                 style={{ color: 'var(--c-muted)' }}>
              <div className="w-2 h-2 rounded-sm flex-shrink-0"
                   style={{ backgroundColor: CAT_COLOR[cat] }} />
              <span>{CATEGORY_LABEL[cat]}</span>
              <span className="font-medium" style={{ color: 'var(--c-soft)' }}>
                {fmtDuration(min)}
              </span>
            </div>
          ))}
        </div>

        {/* Unscheduled tasks */}
        {unscheduled.length > 0 && (
          <div className="text-[11px]" style={{ color: 'var(--c-muted)' }}>
            +{unscheduled.length} sem horário
            <span className="ml-1" style={{ color: 'var(--c-soft)' }}>
              ({fmtDuration(unscheduled.reduce((s, t) => s + t.timeLimitMinutes, 0))})
            </span>
          </div>
        )}
      </div>

      {overloaded && (
        <p className="text-[11px] text-amber-500">
          ⚠ Tarefas somam mais de 24h — revise os horários.
        </p>
      )}
    </div>
  )
}
