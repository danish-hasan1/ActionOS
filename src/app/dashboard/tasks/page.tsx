import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import TasksClient from '@/components/tasks/TasksClient'
export const dynamic = 'force-dynamic'
export default async function TasksPage() {
  const supabase = await createClient()
  const [{ data: tasks }, { data: painPoints }, { data: goals }] = await Promise.all([
    supabase.from('tasks').select('*').eq('owner_id', OWNER_ID).order('created_at', { ascending: false }),
    supabase.from('pain_points').select('id, title').eq('owner_id', OWNER_ID).order('title'),
    supabase.from('goals').select('id, title').eq('owner_id', OWNER_ID).order('title'),
  ])
  return (
    <div>
      <PageHeader title="Tasks" description="Track every action item across all pain points, goals, and phases." />
      <TasksClient initialTasks={tasks ?? []} painPoints={painPoints ?? []} goals={goals ?? []} userId={OWNER_ID} />
    </div>
  )
}
