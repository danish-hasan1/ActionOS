import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import ReportsClient from '@/components/reports/ReportsClient'
export const dynamic = 'force-dynamic'
export default async function ReportsPage() {
  const supabase = await createClient()

  const ninetyAgo = new Date()
  ninetyAgo.setDate(ninetyAgo.getDate() - 90)

  const [{ data: painPoints }, { data: goals }, { data: tasks }, { data: milestones }, { data: reports }, { data: dailyTasks }] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', OWNER_ID),
    supabase.from('goals').select('*').eq('owner_id', OWNER_ID),
    supabase.from('tasks').select('*').eq('owner_id', OWNER_ID),
    supabase.from('milestones').select('*').eq('owner_id', OWNER_ID),
    supabase.from('reports').select('*').eq('owner_id', OWNER_ID).order('created_at', { ascending: false }),
    supabase.from('daily_tasks').select('*').eq('owner_id', OWNER_ID).gte('date', ninetyAgo.toISOString().split('T')[0]).order('date').order('order_index'),
  ])
  return (
    <div>
      <PageHeader title="Reports" description="Generate daily logs, weekly reviews, and leadership-ready status reports." />
      <ReportsClient
        painPoints={painPoints ?? []} goals={goals ?? []} tasks={tasks ?? []}
        milestones={milestones ?? []} initialReports={reports ?? []}
        dailyTasks={dailyTasks ?? []} userId={OWNER_ID}
      />
    </div>
  )
}
