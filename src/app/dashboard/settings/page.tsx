import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui'
import SettingsClient from '@/components/settings/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: settings }, { data: tags }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('owner_id', user!.id).single(),
    supabase.from('tags').select('*').order('category').order('name'),
  ])

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, tags, and dashboard preferences." />
      <SettingsClient
        initialSettings={settings}
        initialTags={tags ?? []}
        userId={user!.id}
        userEmail={user!.email ?? ''}
      />
    </div>
  )
}
