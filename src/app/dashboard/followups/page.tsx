import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import FollowupsClient from '@/components/followups/FollowupsClient'
export const dynamic = 'force-dynamic'
export default async function FollowupsPage() {
  const supabase = await createClient()
  await supabase.rpc('mark_overdue_followups')
  const [{ data: followups }, { data: agendas }, { data: tasks }] = await Promise.all([
    supabase.from('followups').select('*').eq('owner_id', OWNER_ID).order('due_date', { ascending: true }),
    supabase.from('agendas').select('id, title').eq('owner_id', OWNER_ID).order('meeting_date', { ascending: false }),
    supabase.from('tasks').select('id, title').eq('owner_id', OWNER_ID).order('title'),
  ])
  return (
    <div>
      <PageHeader title="Follow-ups" description="Track every commitment and action item that needs a follow-up." />
      <FollowupsClient initialFollowups={followups ?? []} agendas={agendas ?? []} tasks={tasks ?? []} userId={OWNER_ID} />
    </div>
  )
}
