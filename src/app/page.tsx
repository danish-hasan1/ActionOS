'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowLeft } from 'lucide-react'

const PALETTE = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6']

function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function getInitials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase()
}

type AppUser = { id: string; name: string }
type View = 'list' | 'pin' | 'new'

function PinInputs({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1)
    const next = [...value]
    next[idx] = digit
    onChange(next)
    if (digit && idx < 3) refs[idx + 1].current?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      const next = [...value]
      if (next[idx]) {
        next[idx] = ''
        onChange(next)
      } else if (idx > 0) {
        refs[idx - 1].current?.focus()
      }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (paste.length === 4) {
      onChange(paste.split(''))
      refs[3].current?.focus()
      e.preventDefault()
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          disabled={disabled}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-2xl font-bold rounded-2xl border-2 border-white/30 bg-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/70 focus:bg-white/20 transition-all backdrop-blur-sm disabled:opacity-50"
          placeholder="•"
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [view, setView] = useState<View>('list')
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null)
  const [pin, setPin] = useState(['', '', '', ''])
  const [newName, setNewName] = useState('')
  const [newPin, setNewPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setUsers(data))
      .catch(() => {})
  }, [])

  function triggerShake(msg: string) {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  function selectUser(user: AppUser) {
    setSelectedUser(user)
    setPin(['', '', '', ''])
    setError('')
    setView('pin')
  }

  async function handleLogin() {
    const pinStr = pin.join('')
    if (pinStr.length < 4) return triggerShake('Enter all 4 digits')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', userId: selectedUser?.id, pin: pinStr }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const body = await res.json()
        triggerShake(body.error || 'Wrong PIN')
        setPin(['', '', '', ''])
      }
    } catch {
      triggerShake('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!newName.trim()) return triggerShake('Name is required')
    const pinStr = newPin.join('')
    if (pinStr.length < 4) return triggerShake('Enter all 4 digits')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name: newName, pin: pinStr }),
      })
      if (res.ok) {
        router.push('/dashboard')
      } else {
        const body = await res.json()
        triggerShake(body.error || 'Registration failed')
      }
    } catch {
      triggerShake('Network error')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setView('list')
    setSelectedUser(null)
    setPin(['', '', '', ''])
    setNewName('')
    setNewPin(['', '', '', ''])
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #6366F1, transparent)',
            top: '-10%',
            left: '-10%',
            animation: 'blobFloat 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #EC4899, transparent)',
            bottom: '-10%',
            right: '-5%',
            animation: 'blobFloat 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #3B82F6, transparent)',
            top: '40%',
            left: '60%',
            animation: 'blobFloat 12s ease-in-out infinite 2s',
          }}
        />
      </div>

      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .shake { animation: shake 0.5s ease-in-out; }
      `}</style>

      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-md"
        style={{ backdropFilter: 'blur(24px)' }}
      >
        <div
          className="rounded-3xl border border-white/20 shadow-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>A</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              ActionPlan OS
            </h1>
            <p className="text-white/50 text-sm">
              {view === 'list' && 'Select your profile'}
              {view === 'pin' && `Welcome back, ${selectedUser?.name}`}
              {view === 'new' && 'Create your account'}
            </p>
          </div>

          {/* ── User list view ── */}
          {view === 'list' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {users.map(user => {
                  const color = getColor(user.name)
                  return (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/15 hover:border-white/30 transition-all group"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-lg group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <span className="text-white/80 text-sm font-medium text-center leading-tight">{user.name}</span>
                    </button>
                  )
                })}

                {/* Add new user button */}
                <button
                  onClick={() => { setView('new'); setError('') }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-dashed border-white/20 bg-white/0 hover:bg-white/10 hover:border-white/40 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-white/30 group-hover:border-white/60 transition-colors">
                    <Plus className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
                  </div>
                  <span className="text-white/40 text-sm font-medium group-hover:text-white/60 transition-colors">New user</span>
                </button>
              </div>

              {users.length === 0 && (
                <p className="text-white/40 text-sm text-center py-4">No users yet. Create one below.</p>
              )}
            </div>
          )}

          {/* ── PIN entry view ── */}
          {view === 'pin' && (
            <div className={shake ? 'shake' : ''}>
              {/* User avatar */}
              {selectedUser && (
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl text-white font-bold text-xl mb-2"
                    style={{ backgroundColor: getColor(selectedUser.name) }}
                  >
                    {getInitials(selectedUser.name)}
                  </div>
                  <span className="text-white/70 text-sm">{selectedUser.name}</span>
                </div>
              )}

              <p className="text-white/60 text-sm text-center mb-4">Enter your 4-digit PIN</p>
              <PinInputs value={pin} onChange={setPin} disabled={loading} />

              {error && (
                <p className="text-red-400 text-sm text-center mt-4 font-medium">{error}</p>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleLogin}
                  disabled={loading || pin.join('').length < 4}
                  className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg"
                >
                  {loading ? 'Verifying...' : 'Enter Dashboard'}
                </button>
                <button
                  onClick={goBack}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-white/50 hover:text-white/80 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to profiles
                </button>
              </div>
            </div>
          )}

          {/* ── New user view ── */}
          {view === 'new' && (
            <div className={shake ? 'shake' : ''}>
              <div className="space-y-5">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Your name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wide">Choose a 4-digit PIN</label>
                  <PinInputs value={newPin} onChange={setNewPin} disabled={loading} />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={handleRegister}
                    disabled={loading || !newName.trim() || newPin.join('').length < 4}
                    className="w-full py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg"
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                  <button
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-white/50 hover:text-white/80 text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to profiles
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
