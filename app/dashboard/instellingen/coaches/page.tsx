'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type CoachProfile = {
  id: string
  coach_email: string
  coach_user_id: string | null
  first_name: string | null
  last_name: string | null
  function: string | null
  coach_certificate: 'geen' | 'VC1' | 'VC2' | 'VC3' | 'VC4' | 'VC5'
  vog_aanwezig: boolean
  vog_date: string | null
  vog_expiry_date: string | null
  notes: string | null
}

const certificateLabels: Record<CoachProfile['coach_certificate'], string> = {
  geen: 'Geen', VC1: 'VC1', VC2: 'VC2', VC3: 'VC3', VC4: 'VC4', VC5: 'VC5',
}

const emptyDraft = (): Omit<CoachProfile, 'id'> => ({
  coach_email: '',
  coach_user_id: null,
  first_name: '',
  last_name: '',
  function: '',
  coach_certificate: 'geen',
  vog_aanwezig: false,
  vog_date: null,
  vog_expiry_date: null,
  notes: '',
})

export default function CoachesPage() {
  const supabase = createClient()
  const [coaches, setCoaches] = useState<CoachProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, CoachProfile>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newCoach, setNewCoach] = useState(emptyDraft())
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase
        .from('CoachProfile')
        .select('*')
        .order('last_name', { nullsFirst: false })
      if (loadError) setError(loadError.message)
      setCoaches((data as CoachProfile[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const summary = useMemo(() => {
    const today = new Date()
    const soon = new Date()
    soon.setMonth(today.getMonth() + 3)
    let withVog = 0
    let expiringSoon = 0
    let expired = 0
    for (const c of coaches) {
      if (c.vog_aanwezig) {
        withVog++
        if (c.vog_expiry_date) {
          const exp = new Date(c.vog_expiry_date)
          if (exp < today) expired++
          else if (exp < soon) expiringSoon++
        }
      }
    }
    return { total: coaches.length, withVog, expiringSoon, expired }
  }, [coaches])

  function getDraft(c: CoachProfile): CoachProfile {
    return drafts[c.id] ?? c
  }

  function updateDraft(id: string, patch: Partial<CoachProfile>) {
    setDrafts(prev => {
      const base = prev[id] ?? coaches.find(c => c.id === id)
      if (!base) return prev
      return { ...prev, [id]: { ...base, ...patch } }
    })
    setSavedId(null)
  }

  async function saveCoach(id: string) {
    const draft = drafts[id]
    if (!draft) return
    setSavingId(id)
    setError('')
    const { error: updateError } = await supabase
      .from('CoachProfile')
      .update({
        coach_email: draft.coach_email,
        first_name: draft.first_name || null,
        last_name: draft.last_name || null,
        function: draft.function || null,
        coach_certificate: draft.coach_certificate,
        vog_aanwezig: draft.vog_aanwezig,
        vog_date: draft.vog_date || null,
        vog_expiry_date: draft.vog_expiry_date || null,
        notes: draft.notes || null,
      })
      .eq('id', id)
    if (updateError) {
      setError(updateError.message)
      setSavingId(null)
      return
    }
    setCoaches(prev => prev.map(c => (c.id === id ? { ...c, ...draft } : c)))
    setDrafts(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSavingId(null)
    setSavedId(id)
  }

  async function deleteCoach(id: string) {
    if (!confirm('Weet je zeker dat je dit coachprofiel wilt verwijderen?')) return
    setDeletingId(id)
    const { error: deleteError } = await supabase.from('CoachProfile').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      setDeletingId(null)
      return
    }
    setCoaches(prev => prev.filter(c => c.id !== id))
    setDeletingId(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('CoachProfile')
      .insert({
        coach_email: newCoach.coach_email,
        first_name: newCoach.first_name || null,
        last_name: newCoach.last_name || null,
        function: newCoach.function || null,
        coach_certificate: newCoach.coach_certificate,
        vog_aanwezig: newCoach.vog_aanwezig,
        vog_date: newCoach.vog_date || null,
        vog_expiry_date: newCoach.vog_expiry_date || null,
        notes: newCoach.notes || null,
      })
      .select()
      .single()
    if (insertError || !data) {
      setError(insertError?.message ?? 'Kon coach niet toevoegen')
      setAdding(false)
      return
    }
    setCoaches(prev => [...prev, data as CoachProfile])
    setNewCoach(emptyDraft())
    setShowAdd(false)
    setAdding(false)
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <p className="text-sm text-gray-400">Coaches laden...</p>
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
          <h1 className="text-2xl font-semibold text-gray-900">Coaches</h1>
          <p className="text-sm text-gray-500 mt-0.5">VOG-status en kwalificaties van coaches.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Coach toevoegen
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Stat label="Coaches" value={summary.total} />
        <Stat label="Met VOG" value={summary.withVog} tone="green" />
        <Stat label="Verloopt < 3 mnd" value={summary.expiringSoon} tone="amber" />
        <Stat label="Verlopen" value={summary.expired} tone="red" />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-mail *</label>
              <input
                type="email"
                required
                value={newCoach.coach_email}
                onChange={e => setNewCoach({ ...newCoach, coach_email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Voornaam</label>
              <input
                type="text"
                value={newCoach.first_name ?? ''}
                onChange={e => setNewCoach({ ...newCoach, first_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Achternaam</label>
              <input
                type="text"
                value={newCoach.last_name ?? ''}
                onChange={e => setNewCoach({ ...newCoach, last_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Functie</label>
              <input
                type="text"
                value={newCoach.function ?? ''}
                onChange={e => setNewCoach({ ...newCoach, function: e.target.value })}
                placeholder="bv. Hoofdcoach"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Diploma</label>
              <select
                value={newCoach.coach_certificate}
                onChange={e => setNewCoach({ ...newCoach, coach_certificate: e.target.value as CoachProfile['coach_certificate'] })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {(Object.keys(certificateLabels) as CoachProfile['coach_certificate'][]).map(c => (
                  <option key={c} value={c}>{certificateLabels[c]}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
              <input
                type="checkbox"
                checked={newCoach.vog_aanwezig}
                onChange={e => setNewCoach({ ...newCoach, vog_aanwezig: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              VOG aanwezig
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewCoach(emptyDraft()) }}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={adding}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm disabled:opacity-50"
            >
              {adding ? 'Bezig...' : 'Coach opslaan'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {coaches.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            Nog geen coaches geregistreerd.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Naam &amp; e-mail</th>
                <th className="text-left px-5 py-3 font-medium">Functie</th>
                <th className="text-left px-5 py-3 font-medium">Diploma</th>
                <th className="text-left px-5 py-3 font-medium">VOG</th>
                <th className="text-left px-5 py-3 font-medium">VOG geldig t/m</th>
                <th className="text-left px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coaches.map(c => {
                const draft = getDraft(c)
                const isDirty = drafts[c.id] !== undefined
                const expiry = draft.vog_expiry_date ? new Date(draft.vog_expiry_date) : null
                const today = new Date()
                const expired = expiry && expiry < today
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={draft.first_name ?? ''}
                            placeholder="Voornaam"
                            onChange={e => updateDraft(c.id, { first_name: e.target.value })}
                            className="w-24 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <input
                            type="text"
                            value={draft.last_name ?? ''}
                            placeholder="Achternaam"
                            onChange={e => updateDraft(c.id, { last_name: e.target.value })}
                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <input
                          type="email"
                          value={draft.coach_email}
                          onChange={e => updateDraft(c.id, { coach_email: e.target.value })}
                          className="w-full border border-gray-100 rounded px-2 py-0.5 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={draft.function ?? ''}
                        onChange={e => updateDraft(c.id, { function: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={draft.coach_certificate}
                        onChange={e => updateDraft(c.id, { coach_certificate: e.target.value as CoachProfile['coach_certificate'] })}
                        className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        {(Object.keys(certificateLabels) as CoachProfile['coach_certificate'][]).map(k => (
                          <option key={k} value={k}>{certificateLabels[k]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <label className="flex items-center gap-1.5 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={draft.vog_aanwezig}
                          onChange={e => updateDraft(c.id, { vog_aanwezig: e.target.checked })}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        {draft.vog_aanwezig ? (
                          <span className="inline-flex items-center gap-0.5 text-green-700"><Check size={12} /> Aanwezig</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-red-600"><X size={12} /> Geen</span>
                        )}
                      </label>
                      {draft.vog_date && (
                        <input
                          type="date"
                          value={draft.vog_date ?? ''}
                          onChange={e => updateDraft(c.id, { vog_date: e.target.value })}
                          className="mt-1 border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        />
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="date"
                        value={draft.vog_expiry_date ?? ''}
                        onChange={e => updateDraft(c.id, { vog_expiry_date: e.target.value })}
                        className={`border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 ${expired ? 'border-red-300 text-red-700' : 'border-gray-200'}`}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => saveCoach(c.id)}
                          disabled={!isDirty || savingId === c.id}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savedId === c.id && !isDirty ? <Check size={12} /> : <Save size={12} />}
                          {savingId === c.id ? '...' : savedId === c.id && !isDirty ? 'OK' : 'Opslaan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCoach(c.id)}
                          disabled={deletingId === c.id}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Verwijderen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Laatste check: {formatDate(new Date().toISOString())} · VOG-vereisten conform clubbeleid en KNVB-richtlijnen.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${tone ? colors[tone] : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
