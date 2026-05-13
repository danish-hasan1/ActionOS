import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import MobileSidebar from '@/components/layout/MobileSidebar'
import QuickAdd from '@/components/ui/QuickAdd'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('start_date, display_name')
    .eq('owner_id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC]">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar startDate={settings?.start_date} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <MobileSidebar startDate={settings?.start_date} />
            <span className="text-sm font-bold text-[#1B3A5C]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</span>
          </div>
          <div className="hidden md:block w-full">
            <TopBar user={user} displayName={settings?.display_name} />
          </div>
          <div className="md:hidden">
            <TopBar user={user} displayName={settings?.display_name} mobileOnly />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Global Quick Add FAB */}
      <QuickAdd userId={user.id} />
    </div>
  )
}
