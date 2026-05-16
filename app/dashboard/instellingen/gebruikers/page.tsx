'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Save, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { roleLabels } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

type AppUser = {
  id: string
  email: string | null
  role: UserRole
  coached_team_ids: string[]
  managed_team_ids: string[]
  hoofdcoach_age_category_ids: string[]
  last_seen: string | null
  email_notifications_enabled: boolean
}

type Team = { id: string; name: string }
type AgeCategory = { id: string; label: string; code: string }

const allRoles: UserRole[] = ['admin', 'tc', 'hoofdcoach', 'coach', 'teammanager', 'speler', 'ouder']

export default function GebruikersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<AppUser[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [categories, setCategories] = useState<AgeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, AppUser>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<UserRole | 'all'>('all')

  useEffect(() => {
    async function load() {
      const [{ data: u, error: uErr }, { data: t }, { data: c }] = await Promise.all([
        supabase.from('User').select('*').order('email'),
        supabase.from('Team').select('id, name').order('name'),
        supabase.from('AgeCategory').select('id, label, code').eq('active', true).order('sort_order'),
      ])
      if (uErr) setError(uErr.message)
      setUsers((u as AppUser[]) ?? [])
      setTeams((t as Team[]) ?? [])
      setCategories((c as AgeCategory[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    if (filter === 'all') return users
    return users.filter(u => u.role === filter)
  }, [users, filter])

  function getDraft(user: AppUser): AppUser {
    return drafts[user.id] ?? user
  }

  function updateDraft(userId: string, patch: Partial<AppUser>) {
    setDrafts(prev => {
      const base = prev[userId] ?? users.find(u => u.id === userId)
      if (!base) return prev
      return { ...prev, [userId]: { ...base, ...patch } }
    })
    setSavedId(null)
  }

  function toggleId(userId: string, field: 'coached_team_ids' | 'managed_team_ids' | 'hoofdcoach_age_category_ids', id: string) {
    const draft = getDraft(users.find(u => u.id === userId)!)
    const current = draft[field] ?? []
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    updateDraft(userId, { [field]: next } as Partial<AppUser>)
  }

  async function saveUser(userId: string) {
    const draft = drafts[userId]
    if (!draft) return
    setSavingId(userId)
    setError('')
    const { error: updateError } = await supabase
      .from('User')
      .update({
        role: draft.role,
        coached_team_ids: draft.coached_team_ids,
        managed_team_ids: draft.managed_team_ids,
        hoofdcoach_age_category_ids: draft.hoofdcoach_age_category_ids,
      })
      .eq('id', userId)
    if (updateError) {
      setError(updateError.message)
      setSavingId(null)
      return
    }
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...draft } : u)))
    setDrafts(prev => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
    setSavingId(null)
    setSavedId(userId)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-sm text-gray-400">Gebruikers laden...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href="/dashboard/instellingen"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar instellingen
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gebruikers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} gebruiker{users.length === 1 ? '' : 's'} · beheer rollen en teamtoewijzingen
          </p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Alle rollen</option>
          {allRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
        </select>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            Geen gebruikers met deze rol.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {filteredUsers.map(user => {
              const draft = getDraft(user)
              const isExpanded = expanded === user.id
              const isDirty = drafts[user.id] !== undefined
              return (
                <li key={user.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-semibold text-xs">
                        {user.email ? user.email.substring(0, 2).toUpperCase() : 'TX'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.email || 'Onbekend'}</p>
                      <p className="text-xs text-gray-400">
                        {draft.coached_team_ids.length} coach · {draft.managed_team_ids.length} manager · {draft.hoofdcoach_age_category_ids.length} cat.
                      </p>
                    </div>
                    <select
                      value={draft.role}
                      onChange={e => updateDraft(user.id, { role: e.target.value as UserRole })}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {allRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : user.id)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5"
                    >
                      Teams
                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => saveUser(user.id)}
                      disabled={!isDirty || savingId === user.id}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savedId === user.id && !isDirty ? <Check size={12} /> : <Save size={12} />}
                      {savingId === user.id ? 'Bezig...' : savedId === user.id && !isDirty ? 'Opgeslagen' : 'Opslaan'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-11 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <CheckboxGroup
                        title="Coach van teams"
                        emptyLabel="Geen teams beschikbaar"
                        options={teams.map(t => ({ id: t.id, label: t.name }))}
                        selected={draft.coached_team_ids}
                        onToggle={id => toggleId(user.id, 'coached_team_ids', id)}
                      />
                      <CheckboxGroup
                        title="Manager van teams"
                        emptyLabel="Geen teams beschikbaar"
                        options={teams.map(t => ({ id: t.id, label: t.name }))}
                        selected={draft.managed_team_ids}
                        onToggle={id => toggleId(user.id, 'managed_team_ids', id)}
                      />
                      <CheckboxGroup
                        title="Hoofdcoach categorieën"
                        emptyLabel="Geen categorieën beschikbaar"
                        options={categories.map(c => ({ id: c.id, label: c.label }))}
                        selected={draft.hoofdcoach_age_category_ids}
                        onToggle={id => toggleId(user.id, 'hoofdcoach_age_category_ids', id)}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function CheckboxGroup({
  title, emptyLabel, options, selected, onToggle,
}: {
  title: string
  emptyLabel: string
  options: { id: string; label: string }[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      {options.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2">
          {options.map(o => (
            <li key={o.id}>
              <label className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 px-2 py-1 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(o.id)}
                  onChange={() => onToggle(o.id)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {o.label}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
