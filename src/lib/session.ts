import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const SESSION_COOKIE = 'apos_uid'

export async function getSessionUserId(): Promise<string | null> {
  const c = await cookies()
  return c.get(SESSION_COOKIE)?.value ?? null
}

export async function requireUserId(): Promise<string> {
  const uid = await getSessionUserId()
  if (!uid) redirect('/')
  return uid
}
