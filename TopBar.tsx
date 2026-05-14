import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import SettingsClient from '@/components/settings/SettingsClient'
export const dynamic = 'force-dynamic'
export default async function SettingsPage() {
  const supabase = await createClient()
  const [{ data: settings }, { data: tags }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('owner_id', OWNER_ID).single(),
    supabase.from('tags').select('*').order('category').order('name'),
  ])
  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, tags, and dashboard preferences." />
      <SettingsClient initialSettings={settings} initialTags={tags ?? []} userId={OWNER_ID} userEmail="" />
    </div>
  )
}
