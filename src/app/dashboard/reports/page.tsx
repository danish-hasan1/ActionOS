import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import ReportsClient from '@/components/reports/ReportsClient'
export const dynamic = 'force-dynamic'
export default async function ReportsPage() {
  const userId = await requireUserId()
  const supabase = await createClient()

  const ninetyAgo = new Date()
  ninetyAgo.setDate(ninetyAgo.getDate() - 90)

  const [{ data: painPoints }, { data: goals }, { data: tasks }, { data: milestones }, { data: reports }, { data: dailyTasks }] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', userId),
    supabase.from('goals').select('*').eq('owner_id', userId),
    supabase.from('tasks').select('*').eq('owner_id', userId),
    supabase.from('milestones').select('*').eq('owner_id', userId),
    supabase.from('reports').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('daily_tasks').select('*').eq('owner_id', userId).gte('date', ninetyAgo.toISOString().split('T')[0]).order('date').order('order_index'),
  ])
  return (
    <div>
      <PageHeader title="Reports" description="Generate daily logs, weekly reviews, and leadership-ready status reports." />
      <ReportsClient
        painPoints={painPoints ?? []} goals={goals ?? []} tasks={tasks ?? []}
        milestones={milestones ?? []} initialReports={reports ?? []}
        dailyTasks={dailyTasks ?? []} userId={userId}
      />
    </div>
  )
}
