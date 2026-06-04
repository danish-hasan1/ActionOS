import { createClient } from '@/lib/supabase/server'
import { requireUserId } from '@/lib/session'
import { PageHeader } from '@/components/ui'
import RolesClient from '@/components/roles/RolesClient'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const userId = await requireUserId()
  const supabase = await createClient()

  const [{ data: roles }, { data: conversations }] = await Promise.all([
    supabase.from('roles').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    supabase.from('role_conversations').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
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
        userId={userId}
      />
    </div>
  )
}
