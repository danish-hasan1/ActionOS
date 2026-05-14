import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import AgendaClient from '@/components/agenda/AgendaClient'
export const dynamic = 'force-dynamic'
export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: agendas } = await supabase.from('agendas').select('*').eq('owner_id', OWNER_ID).order('meeting_date', { ascending: false })
  return (
    <div>
      <PageHeader title="Agenda" description="Run structured meetings with checklists, action items, and follow-up creation." />
      <AgendaClient initialAgendas={agendas ?? []} userId={OWNER_ID} />
    </div>
  )
}
