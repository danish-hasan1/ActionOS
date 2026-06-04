import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import PainPointsClient from '@/components/pain-points/PainPointsClient'
export const dynamic = 'force-dynamic'
export default async function PainPointsPage() {
  const userId = await requireUserId()
  const supabase = await createClient()
  const [{ data: painPoints }, { data: tags }] = await Promise.all([
    supabase.from('pain_points').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('tags').select('*').order('category').order('name'),
  ])
  return (
    <div>
      <PageHeader title="Pain Points" description="Log, categorise, and track every issue you've inherited or discovered." />
      <PainPointsClient initialPainPoints={painPoints ?? []} tags={tags ?? []} userId={userId} />
    </div>
  )
}
