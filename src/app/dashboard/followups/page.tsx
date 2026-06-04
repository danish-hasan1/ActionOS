import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import FollowupsClient from '@/components/followups/FollowupsClient'
export const dynamic = 'force-dynamic'
export default async function FollowupsPage() {
  const userId = await requireUserId()
  const supabase = await createClient()
  await supabase.rpc('mark_overdue_followups')
  const [{ data: followups }, { data: agendas }, { data: tasks }] = await Promise.all([
    supabase.from('followups').select('*').eq('owner_id', userId).order('due_date', { ascending: true }),
    supabase.from('agendas').select('id, title').eq('owner_id', userId).order('meeting_date', { ascending: false }),
    supabase.from('tasks').select('id, title').eq('owner_id', userId).order('title'),
  ])
  return (
    <div>
      <PageHeader title="Follow-ups" description="Track every commitment and action item that needs a follow-up." />
      <FollowupsClient initialFollowups={followups ?? []} agendas={agendas ?? []} tasks={tasks ?? []} userId={userId} />
    </div>
  )
}
