'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B3A5C]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, #E85D26 0%, transparent 50%), radial-gradient(circle at 75% 75%, #2E9E6B 0%, transparent 50%)'
      }} />

      <div className="relative w-full max-w-md mx-4">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E85D26] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>A</span>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-2xl leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ActionPlan OS</p>
              <p className="text-white/50 text-sm">TA Command Center</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {!sent ? (
            <>
              <h2 className="text-2xl font-bold text-[#1B3A5C] mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Welcome back
              </h2>
              <p className="text-slate-500 text-sm mb-6">Enter your email to receive a secure sign-in link.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Work Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:border-transparent transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-[#1B3A5C] hover:bg-[#162d47] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
                >
                  {loading ? 'Sending link...' : 'Send Sign-in Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">
                Private dashboard — access is restricted to authorised users only.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1B3A5C] mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Check your email</h3>
              <p className="text-slate-500 text-sm mb-4">
                We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span>
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm text-[#E85D26] hover:underline"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
