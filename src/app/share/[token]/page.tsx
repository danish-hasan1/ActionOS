import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProgressBar, Badge } from '@/components/ui'
import { SEVERITY_CONFIG, PHASE_CONFIG, formatDate, cn } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Target, Map } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('share_token', params.token)
    .single()

  if (!report) notFound()

  const d = report.report_data as Record<string, unknown> & {
    title: string
    generated_at: string
    stats: { openPainPoints: number; criticalPainPoints: number; totalTasks: number; doneTasks: number; avgGoalProgress: number; completeMilestones: number }
    topPainPoints: { title: string; severity: string }[]
    goals: { title: string; type: string; status: string; progress_pct: number }[]
    milestones: { title: string; phase: string; status: string; end_date: string | null }[]
    notes: string
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Header */}
      <div className="bg-[#1B3A5C] text-white px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wide font-semibold mb-0.5">ActionPlan OS — Shared Report</p>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{d.title}</h1>
            <p className="text-white/50 text-xs mt-1">Generated {new Date(d.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E85D26] flex items-center justify-center">
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>A</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Pain Points', value: d.stats.openPainPoints, sub: `${d.stats.criticalPainPoints} critical`, color: '#EF4444' },
            { label: 'Tasks Complete', value: `${d.stats.doneTasks}/${d.stats.totalTasks}`, color: '#1B3A5C' },
            { label: 'Avg Goal Progress', value: `${d.stats.avgGoalProgress}%`, color: '#2E9E6B' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{s.value}</p>
              {s.sub && <p className="text-xs text-slate-400">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Pain Points */}
        {d.topPainPoints.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <AlertTriangle className="w-4 h-4 text-red-400" /> Active Pain Points Being Addressed
            </h2>
            <div className="space-y-2">
              {d.topPainPoints.map((p, i) => {
                const sev = SEVERITY_CONFIG[p.severity as keyof typeof SEVERITY_CONFIG]
                return (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sev?.dot}`} />
                    <span className="flex-1 text-sm text-slate-700">{p.title}</span>
                    {sev && <Badge label={sev.label} bg={sev.bg} text={sev.text} border={sev.border} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Goals */}
        {d.goals.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <Target className="w-4 h-4 text-violet-500" /> Goal Progress
            </h2>
            <div className="space-y-4">
              {d.goals.map((g, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700 font-medium">{g.title}</span>
                    <span className="text-xs font-bold text-slate-500">{g.progress_pct}%</span>
                  </div>
                  <ProgressBar pct={g.progress_pct} color={g.type === 'short_term' ? '#7C3AED' : '#2E9E6B'} height="h-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones */}
        {d.milestones.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <Map className="w-4 h-4 text-blue-500" /> Milestones
            </h2>
            <div className="space-y-2">
              {d.milestones.map((m, i) => {
                const phaseCfg = PHASE_CONFIG[m.phase as keyof typeof PHASE_CONFIG]
                return (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                    {m.status === 'complete'
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : <div className={cn('w-4 h-4 rounded-full border-2 shrink-0', m.status === 'at_risk' ? 'border-orange-400' : 'border-slate-300')} />
                    }
                    <span className={cn('flex-1 text-sm', m.status === 'complete' ? 'line-through text-slate-400' : 'text-slate-700')}>{m.title}</span>
                    {phaseCfg && <Badge label={phaseCfg.label} bg={phaseCfg.bg} text={phaseCfg.text} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TA Notes */}
        {d.notes && (
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
            <h2 className="font-bold text-amber-800 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>TA Head Notes</h2>
            <p className="text-sm text-amber-700 whitespace-pre-wrap">{d.notes}</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 py-4">
          This is a read-only shared report from ActionPlan OS. Data is accurate as of the generation date above.
        </p>
      </div>
    </div>
  )
}
