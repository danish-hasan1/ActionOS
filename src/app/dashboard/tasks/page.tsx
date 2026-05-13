import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui'
import TasksClient from '@/components/tasks/TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tasks }, { data: painPoints }, { data: goals }] = await Promise.all([
    supabase.from('tasks').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('pain_points').select('id, title').eq('owner_id', user!.id).order('title'),
    supabase.from('goals').select('id, title').eq('owner_id', user!.id).order('title'),
  ])

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Track every action item across all pain points, goals, and phases."
      />
      <TasksClient
        initialTasks={tasks ?? []}
        painPoints={painPoints ?? []}
        goals={goals ?? []}
        userId={user!.id}
      />
    </div>
  )
}
