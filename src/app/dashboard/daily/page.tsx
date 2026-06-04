import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import DailyClient from '@/components/daily/DailyClient'

export const dynamic = 'force-dynamic'

export default async function DailyPage() {
  const userId = await requireUserId()
  const supabase = await createClient()

  // Fetch last 60 days + next 7 days so client-side nav works without round-trips
  const from = new Date()
  from.setDate(from.getDate() - 60)
  const to = new Date()
  to.setDate(to.getDate() + 7)

  const { data: tasks } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('owner_id', userId)
    .gte('date', from.toISOString().split('T')[0])
    .lte('date', to.toISOString().split('T')[0])
    .order('order_index')
    .order('created_at')

  return (
    <div>
      <PageHeader
        title="Daily Tasks"
        description="Your day-by-day to-do list. Quick capture, carry forward, stay on top."
      />
      <DailyClient initialTasks={tasks ?? []} userId={userId} />
    </div>
  )
}
