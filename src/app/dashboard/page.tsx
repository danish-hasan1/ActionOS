import { createClient } from '@/lib/supabase/server'
import { AlertTriangle, CheckSquare, Target, Bell } from 'lucide-react'
import { StatCard, Card, ProgressBar, Badge } from '@/components/ui'
import { SEVERITY_CONFIG, PAIN_STATUS_CONFIG, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: painPoints },
    { data: tasks },
    { data: goals },
    { data: followups },
  ] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', user!.id),
    supabase.from('tasks').select('*').eq('owner_id', user!.id),
    supabase.from('goals').select('*').eq('owner_id', user!.id),
    supabase.from('followups').select('*').eq('owner_id', user!.id).eq('status', 'pending').order('due_date'),
  ])

  const pp = painPoints ?? []
  const tsk = tasks ?? []
  const gl = goals ?? []
  const fu = followups ?? []

  const openPP = pp.filter(p => p.status !== 'resolved')
  const criticalPP = pp.filter(p => p.severity === 'critical')
  const doneTasks = tsk.filter(t => t.status === 'done').length
  const totalTasks = tsk.length
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const avgGoalProgress = gl.length > 0 ? Math.round(gl.reduce((a, g) => a + g.progress_pct, 0) / gl.length) : 0

  // Phase calculation (assume start from first created record or today)
  const today = new Date()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Good day 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Here's your command centre overview.</p>
      </div>

      {/* Phase Banner */}
      <Card className="p-5 mb-6 bg-gradient-to-r from-[#1B3A5C] to-[#2d5a8e] border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-0.5">Current Phase</p>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Phase 1 — Learn & Listen</h2>
            <p className="text-white/60 text-xs">Days 1–30 · Focus: Stakeholder mapping, process audit, pain point logging</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs mb-1">Overall Progress</p>
            <p className="text-white font-bold text-3xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{overallProgress}%</p>
          </div>
        </div>
        <ProgressBar pct={overallProgress} color="#E85D26" height="h-2" />
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Pain Points" value={openPP.length} sub={`${criticalPP.length} critical`} color="#EF4444" icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Tasks" value={`${doneTasks}/${totalTasks}`} sub="completed" color="#1B3A5C" icon={<CheckSquare className="w-4 h-4" />} />
        <StatCard label="Avg Goal Progress" value={`${avgGoalProgress}%`} sub={`${gl.length} goals tracked`} color="#2E9E6B" icon={<Target className="w-4 h-4" />} />
        <StatCard label="Pending Follow-ups" value={fu.length} sub="action required" color="#F59E0B" icon={<Bell className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Pain Points */}
        <Card className="p-5">
          <h3 className="font-bold text-[#1B3A5C] text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Top Pain Points
          </h3>
          {openPP.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No open pain points 🎉</p>
          ) : (
            <div className="space-y-3">
              {openPP.slice(0, 5).map(p => {
                const sev = SEVERITY_CONFIG[p.severity as keyof typeof SEVERITY_CONFIG]
                const stat = PAIN_STATUS_CONFIG[p.status as keyof typeof PAIN_STATUS_CONFIG]
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                    <p className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{p.title}</p>
                    <Badge label={sev.label} bg={sev.bg} text={sev.text} border={sev.border} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Goals Progress */}
        <Card className="p-5">
          <h3 className="font-bold text-[#1B3A5C] text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Goal Progress
          </h3>
          {gl.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No goals set yet</p>
          ) : (
            <div className="space-y-4">
              {gl.slice(0, 5).map(g => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-700 font-medium line-clamp-1">{g.title}</p>
                    <span className="text-xs font-semibold text-slate-500">{g.progress_pct}%</span>
                  </div>
                  <ProgressBar
                    pct={g.progress_pct}
                    color={g.type === 'short_term' ? '#7C3AED' : '#2E9E6B'}
                    height="h-1.5"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pending Follow-ups */}
        <Card className="p-5">
          <h3 className="font-bold text-[#1B3A5C] text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Pending Follow-ups
          </h3>
          {fu.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No pending follow-ups</p>
          ) : (
            <div className="space-y-2">
              {fu.slice(0, 5).map(f => (
                <div key={f.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <p className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{f.title}</p>
                  <span className="text-xs text-slate-400">{f.due_date ? formatDate(f.due_date) : 'No date'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 30/60/90 Phase Cards */}
        <Card className="p-5">
          <h3 className="font-bold text-[#1B3A5C] text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            30/60/90 Day Plan
          </h3>
          <div className="space-y-3">
            {[
              { phase: '30', label: 'Phase 1 — Learn & Listen', color: '#7C3AED', desc: 'Stakeholder 1:1s, process audit, pain point mapping' },
              { phase: '60', label: 'Phase 2 — Fix & Build', color: '#E85D26', desc: 'Quick wins, process redesign, recruiter enablement' },
              { phase: '90', label: 'Phase 3 — Scale & Optimise', color: '#2E9E6B', desc: 'Strategic hiring plan, metrics, tech stack review' },
            ].map(({ phase, label, color, desc }) => {
              const phaseTasks = tsk.filter(t => t.phase === phase)
              const done = phaseTasks.filter(t => t.status === 'done').length
              const pct = phaseTasks.length > 0 ? Math.round((done / phaseTasks.length) * 100) : 0
              return (
                <div key={phase} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{desc}</p>
                  <ProgressBar pct={pct} color={color} height="h-1.5" />
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
