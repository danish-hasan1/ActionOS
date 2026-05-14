import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import RoadmapClient from '@/components/roadmap/RoadmapClient'
export const dynamic = 'force-dynamic'
export default async function RoadmapPage() {
  const supabase = await createClient()
  const [{ data: milestones }, { data: goals }] = await Promise.all([
    supabase.from('milestones').select('*').eq('owner_id', OWNER_ID).order('start_date', { ascending: true }),
    supabase.from('goals').select('id, title').eq('owner_id', OWNER_ID).order('title'),
  ])
  return (
    <div>
      <PageHeader title="Roadmap" description="Your 30/60/90 day milestone timeline — visualise what's on track, at risk, or complete." />
      <RoadmapClient initialMilestones={milestones ?? []} goals={goals ?? []} userId={OWNER_ID} />
    </div>
  )
}
