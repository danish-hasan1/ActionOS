import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { AlertTriangle, CheckSquare, Target, Bell } from 'lucide-react'
import { StatCard, Card, ProgressBar, Badge } from '@/components/ui'
import { SEVERITY_CONFIG, PHASE_CONFIG } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: painPoints },
    { data: tasks },
    { data: goals },
    { data: followups },
    { data: settings },
  ] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', OWNER_ID),
    supabase.from('tasks').select('*').eq('owner_id', OWNER_ID),
    supabase.from('goals').select('*').eq('owner_id', OWNER_ID),
    supabase.from('followups').select('*').eq('owner_id', OWNER_ID).eq('status', 'pending').order('due_date'),
    supabase.from('user_settings').select('start_date, display_name, role_title').eq('owner_id', OWNER_ID).single(),
  ])

  const pp  = painPoints ?? []
  const tsk = tasks ?? []
  const gl  = goals ?? []
  const fu  = followups ?? []

  const openPP     = pp.filter(p => p.status !== 'resolved')
  const criticalPP = pp.filter(p => p.severity === 'critical')
  const doneTasks  = tsk.filter(t => t.status === 'done').length
  const totalTasks = tsk.length
  const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const avgGoalPct = gl.length > 0 ? Math.round(gl.reduce((a, g) => a + g.progress_pct, 0) / gl.length) : 0

  const startDate  = settings?.start_date ? new Date(settings.start_date) : new Date()
  const days       = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1)
  const phase      = days <= 30 ? 1 : days <= 60 ? 2 : 3
  const phaseKey   = days <= 30 ? '30' : days <= 60 ? '60' : '90'
  const phaseLabel = days <= 30 ? 'Learn & Listen' : days <= 60 ? 'Fix & Build' : 'Scale & Optimise'
  const greeting   = settings?.display_name ? `Good day, ${settings.display_name.split(' ')[0]} 👋` : 'Good day 👋'

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{greeting}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{settings?.role_title ?? 'Head of Talent Acquisition'} · Your command centre overview.</p>
      </div>

      <Card className="p-5 mb-6 bg-gradient-to-r from-indigo-500 to-indigo-700 border-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-0.5">Phase {phase} of 3</p>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{phaseLabel}</h2>
            <p className="text-white/50 text-xs mt-0.5">
              Day {days} of 90 · {days <= 30 ? 'Stakeholder mapping, process audit, pain point logging' : days <= 60 ? 'Quick wins, process redesign, recruiter enablement' : 'Strategic hiring plan, metrics, tech stack review'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-xs mb-1">Overall Progress</p>
            <p className="text-white font-bold text-3xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{overallPct}%</p>
          </div>
        </div>
        <ProgressBar pct={overallPct} color="#F59E0B" height="h-2" />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Pain Points" value={openPP.length} sub={`${criticalPP.length} critical`} color="#EF4444" icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Tasks" value={`${doneTasks}/${totalTasks}`} sub="completed" color="#4F46E5" icon={<CheckSquare className="w-4 h-4" />} />
        <StatCard label="Avg Goal Progress" value={`${avgGoalPct}%`} sub={`${gl.length} goals tracked`} color="#10B981" icon={<Target className="w-4 h-4" />} />
        <StatCard label="Pending Follow-ups" value={fu.length} sub="action required" color="#F59E0B" icon={<Bell className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Top Open Pain Points</h3>
          {openPP.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">No open pain points 🎉</p>
          ) : (
            <div className="space-y-2.5">
              {openPP.slice(0, 5).map(p => {
                const sev = SEVERITY_CONFIG[p.severity as keyof typeof SEVERITY_CONFIG]
                return (
                  <div key={p.id} className="flex items-center gap-3 py-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                    <p className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{p.title}</p>
                    <Badge label={sev.label} bg={sev.bg} text={sev.text} border={sev.border} />
                  </div>
                )
              })}
              {openPP.length > 5 && <p className="text-xs text-slate-400 pl-5">+{openPP.length - 5} more</p>}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Goal Progress</h3>
          {gl.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">No goals set yet</p>
          ) : (
            <div className="space-y-4">
              {gl.slice(0, 5).map(g => (
                <div key={g.id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-slate-700 font-medium line-clamp-1 flex-1 mr-3">{g.title}</p>
                    <span className="text-xs font-bold text-slate-500 shrink-0">{g.progress_pct}%</span>
                  </div>
                  <ProgressBar pct={g.progress_pct} color={g.type === 'short_term' ? '#7C3AED' : '#10B981'} height="h-1.5" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Pending Follow-ups</h3>
          {fu.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">No pending follow-ups ✓</p>
          ) : (
            <div className="space-y-2.5">
              {fu.slice(0, 5).map(f => {
                const isOverdue = f.due_date && new Date(f.due_date) < new Date()
                return (
                  <div key={f.id} className="flex items-center gap-3 py-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <p className="flex-1 text-sm text-slate-700 font-medium line-clamp-1">{f.title}</p>
                    {f.due_date && (
                      <span className={`text-xs shrink-0 ${isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                        {new Date(f.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                )
              })}
              {fu.length > 5 && <p className="text-xs text-slate-400 pl-5">+{fu.length - 5} more</p>}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>30/60/90 Day Progress</h3>
          <div className="space-y-4">
            {(['30', '60', '90'] as const).map(ph => {
              const phCfg   = PHASE_CONFIG[ph]
              const phTasks = tsk.filter(t => t.phase === ph)
              const phDone  = phTasks.filter(t => t.status === 'done').length
              const phPct   = phTasks.length > 0 ? Math.round((phDone / phTasks.length) * 100) : 0
              const isCurrent = phaseKey === ph
              return (
                <div key={ph} className="p-3 rounded-xl border"
                  style={isCurrent ? { borderColor: phCfg.color + '60', backgroundColor: phCfg.color + '08' } : { borderColor: '#F1F5F9', backgroundColor: '#F8FAFC' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">{phCfg.label}</p>
                      {isCurrent && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ color: phCfg.color, backgroundColor: phCfg.color + '15' }}>Current</span>}
                    </div>
                    <span className="text-xs font-bold" style={{ color: phCfg.color }}>{phPct}%</span>
                  </div>
                  <ProgressBar pct={phPct} color={phCfg.color} height="h-1.5" />
                  <p className="text-xs text-slate-400 mt-1">{phDone}/{phTasks.length} tasks done</p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
