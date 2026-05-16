'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Player = { id: string; first_name: string; last_name: string }
type Team = { id: string; name: string }
type Season = { id: string; name: string }

const injuryTypes: { value: string; label: string }[] = [
  { value: 'spierblessure', label: 'Spierblessure' },
  { value: 'knieblessure', label: 'Knieblessure' },
  { value: 'enkelblessure', label: 'Enkelblessure' },
  { value: 'hamstring', label: 'Hamstring' },
  { value: 'lies', label: 'Lies' },
  { value: 'rug', label: 'Rug' },
  { value: 'hoofd', label: 'Hoofd' },
  { value: 'breuk', label: 'Breuk' },
  { value: 'overig', label: 'Overig' },
]

export default function BlessureBewerkenPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [injuryId, setInjuryId] = useState('')
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [playerId, setPlayerId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [injuryType, setInjuryType] = useState('spierblessure')
  const [severity, setSeverity] = useState<'licht' | 'matig' | 'ernstig'>('licht')
  const [statusVal, setStatusVal] = useState<'actief' | 'hersteld'>('actief')
  const [startDate, setStartDate] = useState('')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [actualReturn, setActualReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [playerEmail, setPlayerEmail] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentGivenAt, setConsentGivenAt] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setInjuryId(id)
      const [{ data: p }, { data: t }, { data: s }, { data: injury, error: loadError }] = await Promise.all([
        supabase.from('Player').select('id, first_name, last_name').order('last_name'),
        supabase.from('Team').select('id, name').order('name'),
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
        supabase.from('Injury').select('*').eq('id', id).single(),
      ])
      setPlayers((p as Player[]) ?? [])
      setTeams((t as Team[]) ?? [])
      setSeasons((s as Season[]) ?? [])
      if (loadError || !injury) {
        setError(loadError?.message ?? 'Blessure niet gevonden')
        setLoaded(true)
        return
      }
      setPlayerId(injury.player_id ?? '')
      setTeamId(injury.team_id ?? '')
      setSeasonId(injury.season_id ?? '')
      setInjuryType(injury.injury_type ?? 'spierblessure')
      setSeverity(injury.severity ?? 'licht')
      setStatusVal(injury.status ?? 'actief')
      setStartDate(injury.start_date ?? '')
      setExpectedReturn(injury.expected_return ?? '')
      setActualReturn(injury.actual_return ?? '')
      setNotes(injury.notes ?? '')
      setPlayerEmail(injury.player_email ?? '')
      setParentEmail(injury.parent_email ?? '')
      setConsentGiven(injury.consent_given ?? false)
      setConsentGivenAt(injury.consent_given_at ?? null)
      setLoaded(true)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const consentTimestamp = consentGiven
      ? consentGivenAt ?? new Date().toISOString()
      : null

    const { error: updateError } = await supabase.from('Injury').update({
      player_id: playerId,
      team_id: teamId,
      season_id: seasonId,
      injury_type: injuryType,
      severity,
      status: statusVal,
      start_date: startDate,
      expected_return: expectedReturn || null,
      actual_return: actualReturn || null,
      notes: notes || null,
      player_email: playerEmail || null,
      parent_email: parentEmail || null,
      consent_given: consentGiven,
      consent_given_at: consentTimestamp,
    }).eq('id', injuryId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard/blessures')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze blessure wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Injury').delete().eq('id', injuryId)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/blessures')
    router.refresh()
  }

  if (!loaded) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-gray-400">Blessure laden...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/dashboard/blessures/${injuryId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar blessure
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blessure bewerken</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pas de gegevens van deze blessure aan.</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? 'Bezig...' : 'Verwijderen'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Speler *</label>
          <select
            value={playerId}
            onChange={e => setPlayerId(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Kies een speler</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Kies een team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seizoen *</label>
            <select
              value={seasonId}
              onChange={e => setSeasonId(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Kies een seizoen</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type blessure *</label>
            <select
              value={injuryType}
              onChange={e => setInjuryType(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {injuryTypes.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ernst *</label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value as typeof severity)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="licht">Licht</option>
              <option value="matig">Matig</option>
              <option value="ernstig">Ernstig</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusVal}
              onChange={e => setStatusVal(e.target.value as typeof statusVal)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="actief">Actief</option>
              <option value="hersteld">Hersteld</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verwacht terug</label>
            <input
              type="date"
              value={expectedReturn}
              onChange={e => setExpectedReturn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hersteld op</label>
            <input
              type="date"
              value={actualReturn}
              onChange={e => setActualReturn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail speler</label>
            <input
              type="email"
              value={playerEmail}
              onChange={e => setPlayerEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail ouder</label>
            <input
              type="email"
              value={parentEmail}
              onChange={e => setParentEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={e => setConsentGiven(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>Toestemming gegeven voor het vastleggen van deze gezondheidsgegevens (AVG).</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
          <Link
            href={`/dashboard/blessures/${injuryId}`}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Bezig...' : 'Wijzigingen opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
