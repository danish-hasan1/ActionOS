import { createClient } from '@/lib/supabase/server'
import { OWNER_ID } from '@/lib/owner'
import { PageHeader } from '@/components/ui'
import RolesClient from '@/components/roles/RolesClient'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const supabase = await createClient()

  const [{ data: roles }, { data: conversations }] = await Promise.all([
    supabase.from('roles').select('*').eq('owner_id', OWNER_ID).order('created_at', { ascending: false }),
    supabase.from('role_conversations').select('*').eq('owner_id', OWNER_ID).order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Track open positions, capture conversations, and never lose context on a hire."
      />
      <RolesClient
        initialRoles={roles ?? []}
        initialConversations={conversations ?? []}
        userId={OWNER_ID}
      />
    </div>
  )
}
