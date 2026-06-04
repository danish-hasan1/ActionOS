import { createAdminClient } from '@/lib/supabase/admin'
import { requireUserId } from '@/lib/session'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import MobileSidebar from '@/components/layout/MobileSidebar'
import QuickAdd from '@/components/ui/QuickAdd'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId()
  const db = createAdminClient()

  const [{ data: settings }, { data: appUser }] = await Promise.all([
    db.from('user_settings').select('start_date, display_name').eq('owner_id', userId).single(),
    db.from('app_users').select('name').eq('id', userId).single(),
  ])

  const userName = appUser?.name ?? settings?.display_name ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6FA]">
      <div className="hidden md:block">
        <Sidebar startDate={settings?.start_date} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <MobileSidebar startDate={settings?.start_date} />
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</span>
          </div>
          <div className="hidden md:block w-full">
            <TopBar displayName={settings?.display_name} userName={userName} />
          </div>
          <div className="md:hidden">
            <TopBar displayName={settings?.display_name} userName={userName} mobileOnly />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      <QuickAdd userId={userId} />
    </div>
  )
}
