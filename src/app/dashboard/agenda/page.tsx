import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import AgendaClient from '@/components/agenda/AgendaClient'
export const dynamic = 'force-dynamic'
export default async function AgendaPage() {
  const userId = await requireUserId()
  const supabase = await createClient()
  const { data: agendas } = await supabase.from('agendas').select('*').eq('owner_id', userId).order('meeting_date', { ascending: false })
  return (
    <div>
      <PageHeader title="Agenda" description="Run structured meetings with checklists, action items, and follow-up creation." />
      <AgendaClient initialAgendas={agendas ?? []} userId={userId} />
    </div>
  )
}
