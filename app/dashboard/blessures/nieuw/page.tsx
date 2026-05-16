'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Player = { id: string; first_name: string; last_name: string; team_id: string | null; season_id: string | null; player_email: string | null; parent_email: string | null }
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

export default function NieuweBlessurePage() {
  const router = useRouter()
  const supabase = createClient()

  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: t }, { data: s }] = await Promise.all([
        supabase.from('Player').select('id, first_name, last_name, team_id, season_id, player_email, parent_email').order('last_name'),
        supabase.from('Team').select('id, name').order('name'),
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
      ])
      setPlayers((p as Player[]) ?? [])
      setTeams((t as Team[]) ?? [])
      setSeasons((s as Season[]) ?? [])
      const activeSeason = (s as Season[])?.[0]
      if (activeSeason) setSeasonId(activeSeason.id)
    }
    load()
  }, [])

  useEffect(() => {
    const p = players.find(x => x.id === playerId)
    if (!p) return
    if (p.team_id) setTeamId(p.team_id)
    if (p.season_id) setSeasonId(p.season_id)
    if (p.player_email) setPlayerEmail(p.player_email)
    if (p.parent_email) setParentEmail(p.parent_email)
  }, [playerId, players])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('Injury').insert({
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
      consent_given_at: consentGiven ? new Date().toISOString() : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/blessures')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/blessures"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar blessures
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Blessure registreren</h1>
      <p className="text-sm text-gray-500 mb-6">Leg een nieuwe blessure vast voor een speler.</p>

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

        <div className="grid grid-cols-2 gap-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Beschrijving, behandeling, fysio-info…"
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
            href="/dashboard/blessures"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Blessure opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
