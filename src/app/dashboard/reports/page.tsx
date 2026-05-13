import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui'
import ReportsClient from '@/components/reports/ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: painPoints },
    { data: goals },
    { data: tasks },
    { data: milestones },
    { data: reports },
  ] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', user!.id),
    supabase.from('goals').select('*').eq('owner_id', user!.id),
    supabase.from('tasks').select('*').eq('owner_id', user!.id),
    supabase.from('milestones').select('*').eq('owner_id', user!.id),
    supabase.from('reports').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <PageHeader title="Reports" description="Generate leadership-ready summaries and share via a secure read-only link." />
      <ReportsClient
        painPoints={painPoints ?? []}
        goals={goals ?? []}
        tasks={tasks ?? []}
        milestones={milestones ?? []}
        initialReports={reports ?? []}
        userId={user!.id}
      />
    </div>
  )
}
