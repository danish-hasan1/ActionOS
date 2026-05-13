import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui'
import AgendaClient from '@/components/agenda/AgendaClient'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: agendas } = await supabase
    .from('agendas')
    .select('*')
    .eq('owner_id', user!.id)
    .order('meeting_date', { ascending: false })

  return (
    <div>
      <PageHeader title="Agenda" description="Run structured meetings with checklists, action items, and follow-up creation." />
      <AgendaClient initialAgendas={agendas ?? []} userId={user!.id} />
    </div>
  )
}
