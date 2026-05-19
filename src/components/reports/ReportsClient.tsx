'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { upsertReport, deleteReport } from '@/lib/actions'
import {
  FileText, Plus, Trash2, Copy, CheckCircle2, AlertTriangle,
  Target, Map, CalendarDays, CalendarRange, BarChart3,
  CheckSquare, Square, Sun, TrendingUp,
} from 'lucide-react'
import type { PainPoint, Goal, Task, Milestone, Report, DailyTask } from '@/types'
import { Button, Card, ProgressBar, Badge } from '@/components/ui'
import { SEVERITY_CONFIG, PHASE_CONFIG, cn } from '@/lib/utils'

// ─── Date helpers ─────────────────────────────────────────────
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function parseLocal(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function weekRange(anyDay: string): { monday: string; sunday: string } {
  const d = parseLocal(anyDay)
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() - (dow - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return { monday: toISO(mon), sunday: toISO(sun) }
}
function fmtDate(s: string) {
  return parseLocal(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(s: string) {
  return parseLocal(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
function dayLabel(s: string) {
  return parseLocal(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  status:  { label: 'TA Status', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  daily:   { label: 'Daily',     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  weekly:  { label: 'Weekly',    color: 'text-violet-600',  bg: 'bg-violet-50' },
}

// ─── Saved Report Card ────────────────────────────────────────
function ReportCard({ report, onDelete }: { report: Report; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${report.share_token}`
  const rType = (report.report_data as { report_type?: string })?.report_type ?? 'status'
  const typeMeta = TYPE_LABELS[rType] ?? TYPE_LABELS.status

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Share link copied!')
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800 truncate">{(report.report_data as { title?: string })?.title ?? 'Report'}</p>
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full shrink-0', typeMeta.bg, typeMeta.color)}>{typeMeta.label}</span>
        </div>
        <p className="text-xs text-slate-400">{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
          {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Share</>}
        </button>
        <button onClick={() => onDelete(report.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── TA Status Preview ────────────────────────────────────────
function StatusPreview({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    title: string; generated_at: string; summary: string
    stats: { openPainPoints: number; criticalPainPoints: number; totalTasks: number; doneTasks: number; avgGoalProgress: number; completeMilestones: number }
    topPainPoints: { title: string; severity: string }[]
    goals: { title: string; type: string; status: string; progress_pct: number }[]
    milestones: { title: string; phase: string; status: string; end_date: string | null }[]
    notes: string
  }
  return (
    <div className="space-y-6 text-sm">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.title}</h2>
        <p className="text-xs text-slate-400 mt-1">Generated {new Date(d.generated_at).toLocaleString('en-IN')}</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Pain Points', value: d.stats.openPainPoints, sub: `${d.stats.criticalPainPoints} critical`, color: '#EF4444' },
          { label: 'Tasks Done', value: `${d.stats.doneTasks}/${d.stats.totalTasks}`, color: '#4F46E5' },
          { label: 'Avg Goal Progress', value: `${d.stats.avgGoalProgress}%`, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
            {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
          </div>
        ))}
      </div>
      {d.topPainPoints.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Active Pain Points</h3>
          <div className="space-y-1.5">
            {d.topPainPoints.map((p, i) => {
              const sev = SEVERITY_CONFIG[p.severity as keyof typeof SEVERITY_CONFIG]
              return (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sev?.dot}`} />
                  <span className="flex-1 text-sm text-slate-700">{p.title}</span>
                  <Badge label={sev?.label ?? p.severity} bg={sev?.bg} text={sev?.text} border={sev?.border} />
                </div>
              )
            })}
          </div>
        </div>
      )}
      {d.goals.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-violet-500" /> Goal Progress</h3>
          <div className="space-y-3">
            {d.goals.map((g, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700">{g.title}</span>
                  <span className="text-xs font-bold text-slate-500">{g.progress_pct}%</span>
                </div>
                <ProgressBar pct={g.progress_pct} color={g.type === 'short_term' ? '#7C3AED' : '#10B981'} height="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}
      {d.milestones.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Map className="w-4 h-4 text-blue-500" /> Milestones</h3>
          <div className="space-y-1.5">
            {d.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                {m.status === 'complete' ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <div className="w-4 h-4 shrink-0" />}
                <span className={cn('flex-1 text-sm', m.status === 'complete' ? 'line-through text-slate-400' : 'text-slate-700')}>{m.title}</span>
                <Badge label={PHASE_CONFIG[m.phase as keyof typeof PHASE_CONFIG]?.label ?? m.phase} bg={PHASE_CONFIG[m.phase as keyof typeof PHASE_CONFIG]?.bg} text={PHASE_CONFIG[m.phase as keyof typeof PHASE_CONFIG]?.text} />
              </div>
            ))}
          </div>
        </div>
      )}
      {d.notes && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-1">TA Head Notes</h3>
          <p className="text-sm text-amber-700 whitespace-pre-wrap">{d.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Daily Report Preview ─────────────────────────────────────
function DailyPreview({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    title: string; report_type: 'daily'; date: string; generated_at: string
    stats: { total: number; done: number; pct: number }
    tasks: { title: string; checked: boolean; priority: string }[]
    reflection: string
  }
  const priColor: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#94A3B8' }
  return (
    <div className="space-y-5 text-sm">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <Sun className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.title}</h2>
        </div>
        <p className="text-xs text-slate-400">{fmtDate(d.date)} · Generated {new Date(d.generated_at).toLocaleString('en-IN')}</p>
      </div>

      {/* Completion ring-style stat */}
      <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl">
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-600" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.stats.pct}%</p>
          <p className="text-xs text-emerald-500 font-medium">complete</p>
        </div>
        <div className="flex-1">
          <ProgressBar pct={d.stats.pct} color="#10B981" height="h-2.5" />
          <p className="text-xs text-slate-500 mt-1.5">{d.stats.done} of {d.stats.total} tasks done</p>
        </div>
      </div>

      {/* Task list */}
      {d.tasks.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-500" /> Daily Tasks
          </h3>
          <div className="space-y-1.5">
            {d.tasks.map((t, i) => (
              <div key={i} className={cn('flex items-center gap-2.5 p-2.5 rounded-lg', t.checked ? 'bg-slate-50' : 'bg-white border border-slate-100')}>
                {t.checked ? <CheckSquare className="w-4 h-4 text-green-500 shrink-0" /> : <Square className="w-4 h-4 shrink-0" style={{ color: priColor[t.priority] }} />}
                <span className={cn('flex-1 text-sm', t.checked ? 'line-through text-slate-400' : 'text-slate-700')}>{t.title}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: priColor[t.priority] }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {d.reflection && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-1">Reflection</h3>
          <p className="text-sm text-amber-700 whitespace-pre-wrap">{d.reflection}</p>
        </div>
      )}
    </div>
  )
}

// ─── Weekly Report Preview ────────────────────────────────────
function WeeklyPreview({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    title: string; report_type: 'weekly'; monday: string; sunday: string; generated_at: string
    stats: { totalTasks: number; doneTasks: number; pct: number; activeDays: number }
    days: { date: string; total: number; done: number }[]
    wins: string; blockers: string
  }
  return (
    <div className="space-y-5 text-sm">
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <CalendarRange className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.title}</h2>
        </div>
        <p className="text-xs text-slate-400">{fmtShort(d.monday)} – {fmtShort(d.sunday)} · Generated {new Date(d.generated_at).toLocaleString('en-IN')}</p>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tasks Done', value: `${d.stats.doneTasks}/${d.stats.totalTasks}`, color: '#7C3AED' },
          { label: 'Completion', value: `${d.stats.pct}%`, color: '#10B981' },
          { label: 'Active Days', value: d.stats.activeDays, color: '#4F46E5' },
        ].map(s => (
          <div key={s.label} className="p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Day-by-day breakdown */}
      <div>
        <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-500" /> Day-by-Day Breakdown
        </h3>
        <div className="space-y-2">
          {d.days.map((day, i) => {
            const pct = day.total > 0 ? Math.round((day.done / day.total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-24 shrink-0">{dayLabel(day.date)}</span>
                {day.total === 0 ? (
                  <span className="text-xs text-slate-300 italic">No tasks</span>
                ) : (
                  <>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#10B981' : '#7C3AED' }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-14 text-right shrink-0">{day.done}/{day.total} ({pct}%)</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {d.wins && (
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <h3 className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Wins</h3>
          <p className="text-sm text-emerald-700 whitespace-pre-wrap">{d.wins}</p>
        </div>
      )}
      {d.blockers && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <h3 className="font-bold text-red-800 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Blockers</h3>
          <p className="text-sm text-red-700 whitespace-pre-wrap">{d.blockers}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
type Tab = 'status' | 'daily' | 'weekly'

export default function ReportsClient({ painPoints, goals, tasks, milestones, initialReports, dailyTasks, userId }: {
  painPoints: PainPoint[]
  goals: Goal[]
  tasks: Task[]
  milestones: Milestone[]
  initialReports: Report[]
  dailyTasks: DailyTask[]
  userId: string
}) {
  const todayStr = toISO(new Date())
  const [tab, setTab] = useState<Tab>('status')
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)

  // ── Status report state ──
  const [statusTitle, setStatusTitle] = useState(`TA Status Report — ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`)
  const [statusNotes, setStatusNotes] = useState('')

  // ── Daily report state ──
  const [dailyDate, setDailyDate] = useState(todayStr)
  const [dailyReflection, setDailyReflection] = useState('')

  // ── Weekly report state ──
  const [weekAnchor, setWeekAnchor] = useState(todayStr)
  const [weekWins, setWeekWins] = useState('')
  const [weekBlockers, setWeekBlockers] = useState('')

  // ── Builders ──
  function buildStatus() {
    const openPP = painPoints.filter(p => p.status !== 'resolved')
    const done = tasks.filter(t => t.status === 'done')
    const avgGoal = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress_pct, 0) / goals.length) : 0
    return {
      report_type: 'status',
      title: statusTitle,
      generated_at: new Date().toISOString(),
      summary: `TA Head Status Report covering ${painPoints.length} pain points, ${goals.length} goals, and ${tasks.length} tasks.`,
      stats: {
        openPainPoints: openPP.length,
        criticalPainPoints: painPoints.filter(p => p.severity === 'critical').length,
        totalTasks: tasks.length, doneTasks: done.length,
        avgGoalProgress: avgGoal,
        completeMilestones: milestones.filter(m => m.status === 'complete').length,
      },
      topPainPoints: openPP.slice(0, 5).map(p => ({ title: p.title, severity: p.severity })),
      goals: goals.map(g => ({ title: g.title, type: g.type, status: g.status, progress_pct: g.progress_pct })),
      milestones: milestones.map(m => ({ title: m.title, phase: m.phase, status: m.status, end_date: m.end_date })),
      notes: statusNotes,
    }
  }

  function buildDaily() {
    const dayTasks = dailyTasks.filter(t => t.date === dailyDate)
    const done = dayTasks.filter(t => t.checked).length
    const pct = dayTasks.length > 0 ? Math.round((done / dayTasks.length) * 100) : 0
    const label = dailyDate === todayStr ? 'Today' : fmtShort(dailyDate)
    return {
      report_type: 'daily',
      title: `Daily Report — ${label}`,
      date: dailyDate,
      generated_at: new Date().toISOString(),
      stats: { total: dayTasks.length, done, pct },
      tasks: dayTasks.map(t => ({ title: t.title, checked: t.checked, priority: t.priority })),
      reflection: dailyReflection,
    }
  }

  function buildWeekly() {
    const { monday, sunday } = weekRange(weekAnchor)
    const weekTasks = dailyTasks.filter(t => t.date >= monday && t.date <= sunday)
    const done = weekTasks.filter(t => t.checked).length
    const pct = weekTasks.length > 0 ? Math.round((done / weekTasks.length) * 100) : 0

    // Build day-by-day
    const days = []
    const cur = parseLocal(monday)
    while (toISO(cur) <= sunday) {
      const dateStr = toISO(cur)
      const dayTs = weekTasks.filter(t => t.date === dateStr)
      days.push({ date: dateStr, total: dayTs.length, done: dayTs.filter(t => t.checked).length })
      cur.setDate(cur.getDate() + 1)
    }
    const activeDays = days.filter(d => d.total > 0).length

    return {
      report_type: 'weekly',
      title: `Weekly Report — ${fmtShort(monday)} to ${fmtShort(sunday)}`,
      monday, sunday,
      generated_at: new Date().toISOString(),
      stats: { totalTasks: weekTasks.length, doneTasks: done, pct, activeDays },
      days,
      wins: weekWins,
      blockers: weekBlockers,
    }
  }

  function handlePreview() {
    setPreview(tab === 'status' ? buildStatus() : tab === 'daily' ? buildDaily() : buildWeekly())
  }

  async function handleGenerate() {
    setGenerating(true)
    const reportData = tab === 'status' ? buildStatus() : tab === 'daily' ? buildDaily() : buildWeekly()
    const { data, error } = await upsertReport({ title: reportData.title, report_data: reportData, owner_id: userId })
    if (error) { toast.error(error) }
    else {
      setReports(prev => [data as Report, ...prev])
      setPreview(null)
      toast.success('Report saved!')
    }
    setGenerating(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this report?')) return
    const { error } = await deleteReport(id)
    if (error) toast.error(error)
    else { setReports(prev => prev.filter(r => r.id !== id)); toast.success('Report deleted') }
  }

  // Daily helpers
  const dayTasks = dailyTasks.filter(t => t.date === dailyDate)
  const { monday, sunday } = weekRange(weekAnchor)
  const weekTasks = dailyTasks.filter(t => t.date >= monday && t.date <= sunday)

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Left: Generator ── */}
      <div className="space-y-5">
        <Card className="p-5">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
            {([
              { key: 'daily',  label: 'Daily',     icon: <CalendarDays className="w-3.5 h-3.5" /> },
              { key: 'weekly', label: 'Weekly',     icon: <CalendarRange className="w-3.5 h-3.5" /> },
              { key: 'status', label: 'TA Status',  icon: <BarChart3 className="w-3.5 h-3.5" /> },
            ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setPreview(null) }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all',
                  tab === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* ── Daily form ── */}
          {tab === 'daily' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
                <input type="date" className={inputCls} value={dailyDate} onChange={e => setDailyDate(e.target.value)} max={todayStr} />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This report will include</p>
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">No daily tasks found for this date.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />{dayTasks.filter(t => t.checked).length}/{dayTasks.length} tasks completed</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />{dayTasks.filter(t => !t.checked).length} pending tasks</div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reflection <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What went well? What was challenging? Key learnings..." value={dailyReflection} onChange={e => setDailyReflection(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Weekly form ── */}
          {tab === 'weekly' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Any day in the week</label>
                <input type="date" className={inputCls} value={weekAnchor} onChange={e => setWeekAnchor(e.target.value)} max={todayStr} />
                <p className="text-xs text-slate-400 mt-1">Week: {fmtShort(monday)} – {fmtShort(sunday)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This report will include</p>
                {weekTasks.length === 0 ? (
                  <p className="text-xs text-slate-400">No daily tasks found for this week.</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />{weekTasks.filter(t => t.checked).length}/{weekTasks.length} tasks across the week</div>
                    <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />Day-by-day breakdown (Mon–Sun)</div>
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Wins <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Key achievements this week..." value={weekWins} onChange={e => setWeekWins(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Blockers <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Challenges or blockers to flag..." value={weekBlockers} onChange={e => setWeekBlockers(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── TA Status form ── */}
          {tab === 'status' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Report Title</label>
                <input className={inputCls} value={statusTitle} onChange={e => setStatusTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">TA Head Notes <span className="text-slate-400 font-normal">(optional narrative for leadership)</span></label>
                <textarea className={inputCls + ' resize-none'} rows={4} placeholder="Add context, highlights, or strategic notes for leadership..." value={statusNotes} onChange={e => setStatusNotes(e.target.value)} />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This report will include</p>
                {[
                  `${painPoints.filter(p => p.status !== 'resolved').length} open pain points`,
                  `${goals.length} goals with progress`,
                  `${tasks.filter(t => t.status === 'done').length}/${tasks.length} tasks completed`,
                  `${milestones.length} milestones across all phases`,
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />{item}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-5">
            <Button variant="secondary" onClick={handlePreview} className="flex-1">Preview</Button>
            <Button onClick={handleGenerate} disabled={generating} className="flex-1">
              {generating ? 'Saving...' : <><Plus className="w-4 h-4" /> Save Report</>}
            </Button>
          </div>
        </Card>

        {/* Saved reports */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Saved Reports</h3>
          {reports.length === 0 ? (
            <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400">No reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map(r => <ReportCard key={r.id} report={r} onDelete={handleDelete} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Preview ── */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
          {preview ? 'Preview' : 'Preview will appear here'}
        </h3>
        {preview ? (
          <Card className="p-6">
            {(preview as { report_type?: string }).report_type === 'daily'
              ? <DailyPreview data={preview} />
              : (preview as { report_type?: string }).report_type === 'weekly'
              ? <WeeklyPreview data={preview} />
              : <StatusPreview data={preview} />
            }
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 text-center p-6">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">
              Configure your report, then click <span className="font-semibold">Preview</span> to see it before saving.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
