'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Player = { id: string; first_name: string; last_name: string; team_id: string | null; season_id: string | null }
type Team = { id: string; name: string }
type Season = { id: string; name: string }

const scoreFields: { key: string; label: string; group: string }[] = [
  { key: 'tech_ball_control', label: 'Balcontrole', group: 'Techniek' },
  { key: 'tech_passing', label: 'Passen', group: 'Techniek' },
  { key: 'tech_dribbling', label: 'Dribbelen', group: 'Techniek' },
  { key: 'tact_game_insight', label: 'Spelinzicht', group: 'Tactiek' },
  { key: 'tact_positioning', label: 'Positiekeuze', group: 'Tactiek' },
  { key: 'tact_transition', label: 'Omschakeling', group: 'Tactiek' },
  { key: 'phys_speed', label: 'Snelheid', group: 'Fysiek' },
  { key: 'phys_endurance', label: 'Uithoudingsvermogen', group: 'Fysiek' },
  { key: 'phys_strength', label: 'Kracht', group: 'Fysiek' },
  { key: 'ment_effort', label: 'Inzet', group: 'Mentaal' },
  { key: 'ment_coachability', label: 'Coachbaarheid', group: 'Mentaal' },
  { key: 'ment_teamwork', label: 'Samenwerking', group: 'Mentaal' },
]

export default function NieuweBeoordelingPage() {
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
  const [assessorEmail, setAssessorEmail] = useState('')
  const [assessorName, setAssessorName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [scores, setScores] = useState<Record<string, string>>({})
  const [coachNotes, setCoachNotes] = useState('')
  const [developmentAdvice, setDevelopmentAdvice] = useState('')
  const [sharedWithPlayer, setSharedWithPlayer] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: t }, { data: s }, { data: { user } }] = await Promise.all([
        supabase.from('Player').select('id, first_name, last_name, team_id, season_id').order('last_name'),
        supabase.from('Team').select('id, name').order('name'),
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
        supabase.auth.getUser(),
      ])
      setPlayers((p as Player[]) ?? [])
      setTeams((t as Team[]) ?? [])
      setSeasons((s as Season[]) ?? [])
      const activeSeason = (s as Season[])?.[0]
      if (activeSeason) setSeasonId(activeSeason.id)
      if (user?.email) setAssessorEmail(user.email)
    }
    load()
  }, [])

  useEffect(() => {
    const p = players.find(x => x.id === playerId)
    if (!p) return
    if (p.team_id) setTeamId(p.team_id)
    if (p.season_id) setSeasonId(p.season_id)
  }, [playerId, players])

  function setScore(key: string, value: string) {
    setScores(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const numericScores: Record<string, number | null> = {}
    for (const { key } of scoreFields) {
      const raw = scores[key]
      numericScores[key] = raw === undefined || raw === '' ? null : Number(raw)
    }

    const { error: insertError } = await supabase.from('Assessment').insert({
      player_id: playerId,
      team_id: teamId,
      season_id: seasonId,
      assessor_email: assessorEmail,
      assessor_name: assessorName || null,
      date,
      ...numericScores,
      coach_notes: coachNotes || null,
      development_advice: developmentAdvice || null,
      shared_with_player: sharedWithPlayer,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/beoordelingen')
    router.refresh()
  }

  const grouped = scoreFields.reduce<Record<string, typeof scoreFields>>((acc, f) => {
    acc[f.group] = acc[f.group] || []
    acc[f.group].push(f)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/beoordelingen"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar beoordelingen
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nieuwe beoordeling</h1>
      <p className="text-sm text-gray-500 mb-6">Beoordeel een speler op techniek, tactiek, fysiek en mentaal.</p>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beoordelaar *</label>
            <input
              type="email"
              value={assessorEmail}
              onChange={e => setAssessorEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Naam beoordelaar</label>
            <input
              type="text"
              value={assessorName}
              onChange={e => setAssessorName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {Object.entries(grouped).map(([group, fields]) => (
          <div key={group} className="pt-2 border-t border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{group}</h3>
            <div className="grid grid-cols-3 gap-4">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={scores[f.key] ?? ''}
                    onChange={e => setScore(f.key, e.target.value)}
                    placeholder="1–10"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">Coach-notities</label>
          <textarea
            value={coachNotes}
            onChange={e => setCoachNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ontwikkeladvies</label>
          <textarea
            value={developmentAdvice}
            onChange={e => setDevelopmentAdvice(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={sharedWithPlayer}
            onChange={e => setSharedWithPlayer(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>Beoordeling delen met speler</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
          <Link
            href="/dashboard/beoordelingen"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Beoordeling opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
