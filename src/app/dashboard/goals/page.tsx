import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import GoalsClient from '@/components/goals/GoalsClient'
export const dynamic = 'force-dynamic'
export default async function GoalsPage() {
  const userId = await requireUserId()
  const supabase = await createClient()
  const [{ data: goals }, { data: tasks }] = await Promise.all([
    supabase.from('goals').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('tasks').select('id, title, status, goal_id').eq('owner_id', userId),
  ])
  return (
    <div>
      <PageHeader title="Goals" description="Short-term wins and long-term strategic targets — all tracked with live progress." />
      <GoalsClient initialGoals={goals ?? []} allTasks={tasks ?? []} userId={userId} />
    </div>
  )
}
