'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Player = { id: string; first_name: string; last_name: string }
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

export default function BeoordelingBewerkenPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [assessmentId, setAssessmentId] = useState('')
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
  const [assessorEmail, setAssessorEmail] = useState('')
  const [assessorName, setAssessorName] = useState('')
  const [date, setDate] = useState('')
  const [scores, setScores] = useState<Record<string, string>>({})
  const [coachNotes, setCoachNotes] = useState('')
  const [developmentAdvice, setDevelopmentAdvice] = useState('')
  const [sharedWithPlayer, setSharedWithPlayer] = useState(false)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setAssessmentId(id)
      const [{ data: p }, { data: t }, { data: s }, { data: a, error: loadError }] = await Promise.all([
        supabase.from('Player').select('id, first_name, last_name').order('last_name'),
        supabase.from('Team').select('id, name').order('name'),
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
        supabase.from('Assessment').select('*').eq('id', id).single(),
      ])
      setPlayers((p as Player[]) ?? [])
      setTeams((t as Team[]) ?? [])
      setSeasons((s as Season[]) ?? [])
      if (loadError || !a) {
        setError(loadError?.message ?? 'Beoordeling niet gevonden')
        setLoaded(true)
        return
      }
      setPlayerId(a.player_id ?? '')
      setTeamId(a.team_id ?? '')
      setSeasonId(a.season_id ?? '')
      setAssessorEmail(a.assessor_email ?? '')
      setAssessorName(a.assessor_name ?? '')
      setDate(a.date ?? '')
      const initial: Record<string, string> = {}
      for (const f of scoreFields) {
        const v = a[f.key]
        initial[f.key] = v == null ? '' : String(v)
      }
      setScores(initial)
      setCoachNotes(a.coach_notes ?? '')
      setDevelopmentAdvice(a.development_advice ?? '')
      setSharedWithPlayer(a.shared_with_player ?? false)
      setLoaded(true)
    }
    load()
  }, [])

  function setScore(key: string, value: string) {
    setScores(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const numericScores: Record<string, number | null> = {}
    for (const { key } of scoreFields) {
      const raw = scores[key]
      numericScores[key] = raw === undefined || raw === '' ? null : Number(raw)
    }

    const { error: updateError } = await supabase.from('Assessment').update({
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
    }).eq('id', assessmentId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard/beoordelingen')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze beoordeling wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Assessment').delete().eq('id', assessmentId)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/beoordelingen')
    router.refresh()
  }

  if (!loaded) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Beoordeling laden...</p>
      </div>
    )
  }

  const grouped = scoreFields.reduce<Record<string, typeof scoreFields>>((acc, f) => {
    acc[f.group] = acc[f.group] || []
    acc[f.group].push(f)
    return acc
  }, {})

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/beoordelingen/${assessmentId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar beoordeling
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Beoordeling bewerken</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pas scores, notities en ontwikkeladvies aan.</p>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {f.label}
                    <span className="ml-1 text-gray-400 tabular-nums">
                      {scores[f.key] ? `(${scores[f.key]})` : ''}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={scores[f.key] || '5'}
                    onChange={e => setScore(f.key, e.target.value)}
                    className="w-full accent-green-600"
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
            href={`/dashboard/beoordelingen/${assessmentId}`}
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
