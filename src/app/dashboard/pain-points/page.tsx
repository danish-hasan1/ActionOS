import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui'
import PainPointsClient from '@/components/pain-points/PainPointsClient'
import { AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PainPointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: painPoints }, { data: tags }] = await Promise.all([
    supabase
      .from('pain_points')
      .select('*')
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase.from('tags').select('*').order('category').order('name'),
  ])

  return (
    <div>
      <PageHeader
        title="Pain Points"
        description="Log, categorise, and track every issue you've inherited or discovered."
      />
      <PainPointsClient
        initialPainPoints={painPoints ?? []}
        tags={tags ?? []}
        userId={user!.id}
      />
    </div>
  )
}
