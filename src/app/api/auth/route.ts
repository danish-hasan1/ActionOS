import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COOKIE = 'apos_uid'
const opts = { httpOnly: true, path: '/', sameSite: 'strict' as const, maxAge: 60 * 60 * 24 * 30 }

export async function POST(req: Request) {
  const { action, name, pin, userId } = await req.json()
  const db = createAdminClient()

  if (action === 'login') {
    const { data, error } = await db.from('app_users').select('id').eq('id', userId).eq('pin', pin).single()
    if (error || !data) return NextResponse.json({ error: 'Wrong PIN' }, { status: 401 })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE, data.id, opts)
    return res
  }

  if (action === 'register') {
    if (!name?.trim() || !pin || pin.length !== 4) return NextResponse.json({ error: 'Name and 4-digit PIN required' }, { status: 400 })
    const { data, error } = await db.from('app_users').insert({ name: name.trim(), pin }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE, data.id, opts)
    return res
  }

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true })
    res.cookies.delete(COOKIE)
    return res
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
