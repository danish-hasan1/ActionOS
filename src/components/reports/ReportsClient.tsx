'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FileText, Plus, Trash2, Copy, CheckCircle2, AlertTriangle, Target, Map } from 'lucide-react'
import type { PainPoint, Goal, Task, Milestone, Report } from '@/types'
import { Button, Card, ProgressBar, Badge } from '@/components/ui'
import { SEVERITY_CONFIG, PHASE_CONFIG, cn } from '@/lib/utils'

// ─── Report Preview ───────────────────────────────────────────
function ReportPreview({ data }: { data: Record<string, unknown> }) {
  const d = data as {
    title: string
    generated_at: string
    summary: string
    stats: { openPainPoints: number; criticalPainPoints: number; totalTasks: number; doneTasks: number; avgGoalProgress: number; completeMilestones: number }
    topPainPoints: { title: string; severity: string }[]
    goals: { title: string; type: string; status: string; progress_pct: number }[]
    milestones: { title: string; phase: string; status: string; end_date: string | null }[]
    notes: string
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#1B3A5C]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.title}</h2>
        <p className="text-xs text-slate-400 mt-1">Generated {new Date(d.generated_at).toLocaleString('en-IN')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Pain Points', value: d.stats.openPainPoints, sub: `${d.stats.criticalPainPoints} critical`, color: '#EF4444' },
          { label: 'Tasks Done', value: `${d.stats.doneTasks}/${d.stats.totalTasks}`, color: '#1B3A5C' },
          { label: 'Avg Goal Progress', value: `${d.stats.avgGoalProgress}%`, color: '#2E9E6B' },
        ].map(s => (
          <div key={s.label} className="p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
            {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Pain Points */}
      {d.topPainPoints.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Active Pain Points Being Addressed</h3>
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

      {/* Goals */}
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
                <ProgressBar pct={g.progress_pct} color={g.type === 'short_term' ? '#7C3AED' : '#2E9E6B'} height="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
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

      {/* Notes */}
      {d.notes && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-1">TA Head Notes</h3>
          <p className="text-sm text-amber-700 whitespace-pre-wrap">{d.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Past Report Card ─────────────────────────────────────────
function ReportCard({ report, onDelete }: { report: Report; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${report.share_token}`

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Share link copied!')
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-shadow">
      <div className="w-9 h-9 rounded-xl bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-[#1B3A5C]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{(report.report_data as { title?: string })?.title ?? 'Report'}</p>
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

// ─── Main Component ───────────────────────────────────────────
export default function ReportsClient({ painPoints, goals, tasks, milestones, initialReports, userId }: {
  painPoints: PainPoint[]
  goals: Goal[]
  tasks: Task[]
  milestones: Milestone[]
  initialReports: Report[]
  userId: string
}) {
  const supabase = createClient()
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [reportTitle, setReportTitle] = useState(`TA Status Report — ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`)
  const [notes, setNotes] = useState('')

  function buildReportData() {
    const openPP = painPoints.filter(p => p.status !== 'resolved')
    const done = tasks.filter(t => t.status === 'done')
    const avgGoal = goals.length > 0 ? Math.round(goals.reduce((a, g) => a + g.progress_pct, 0) / goals.length) : 0

    return {
      title: reportTitle,
      generated_at: new Date().toISOString(),
      summary: `TA Head Status Report covering ${painPoints.length} pain points, ${goals.length} goals, and ${tasks.length} tasks.`,
      stats: {
        openPainPoints: openPP.length,
        criticalPainPoints: painPoints.filter(p => p.severity === 'critical').length,
        totalTasks: tasks.length,
        doneTasks: done.length,
        avgGoalProgress: avgGoal,
        completeMilestones: milestones.filter(m => m.status === 'complete').length,
      },
      topPainPoints: openPP.slice(0, 5).map(p => ({ title: p.title, severity: p.severity })),
      goals: goals.map(g => ({ title: g.title, type: g.type, status: g.status, progress_pct: g.progress_pct })),
      milestones: milestones.map(m => ({ title: m.title, phase: m.phase, status: m.status, end_date: m.end_date })),
      notes,
    }
  }

  function handlePreview() {
    setPreview(buildReportData())
  }

  async function handleGenerate() {
    setGenerating(true)
    const reportData = buildReportData()
    const { data, error } = await supabase.from('reports').insert({
      title: reportTitle,
      report_data: reportData,
      owner_id: userId,
    }).select().single()

    if (error) { toast.error(error.message) }
    else {
      setReports(prev => [data as Report, ...prev])
      setPreview(null)
      toast.success('Report generated and saved!')
    }
    setGenerating(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this report?')) return
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { setReports(prev => prev.filter(r => r.id !== id)); toast.success('Report deleted') }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left — Generate */}
      <div className="space-y-5">
        <Card className="p-5">
          <h3 className="font-bold text-[#1B3A5C] text-base mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Generate New Report
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Report Title</label>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 focus:border-[#1B3A5C]"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">TA Head Notes <span className="text-slate-400 font-normal">(optional narrative for leadership)</span></label>
              <textarea
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30 focus:border-[#1B3A5C] resize-none"
                rows={4}
                placeholder="Add context, highlights, or strategic notes for leadership..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* What gets included */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">This report will include</p>
              {[
                `${painPoints.filter(p => p.status !== 'resolved').length} open pain points`,
                `${goals.length} goals with progress`,
                `${tasks.filter(t => t.status === 'done').length}/${tasks.length} tasks completed`,
                `${milestones.length} milestones across all phases`,
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handlePreview} className="flex-1">Preview Report</Button>
              <Button onClick={handleGenerate} disabled={generating} className="flex-1">
                {generating ? 'Generating...' : <><Plus className="w-4 h-4" /> Generate & Save</>}
              </Button>
            </div>
          </div>
        </Card>

        {/* Past reports */}
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

      {/* Right — Preview */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
          {preview ? 'Report Preview' : 'Preview will appear here'}
        </h3>
        {preview ? (
          <Card className="p-6">
            <ReportPreview data={preview} />
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-slate-200 text-center p-6">
            <FileText className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">Fill in the report title, add optional notes, then click <span className="font-semibold">Preview Report</span> to see the leadership view before generating.</p>
          </div>
        )}
      </div>
    </div>
  )
}
