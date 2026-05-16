'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type Assessment = {
  id: string
  player_id: string
  team_id: string
  season_id: string
  assessor_email: string
  assessor_name: string | null
  date: string
  tech_ball_control: number | null
  tech_passing: number | null
  tech_dribbling: number | null
  tact_game_insight: number | null
  tact_positioning: number | null
  tact_transition: number | null
  phys_speed: number | null
  phys_endurance: number | null
  phys_strength: number | null
  ment_effort: number | null
  ment_coachability: number | null
  ment_teamwork: number | null
  coach_notes: string | null
  development_advice: string | null
  shared_with_player: boolean
  Player?: { first_name: string; last_name: string } | null
  Team?: { name: string } | null
  Season?: { name: string } | null
}

const scoreFields: { key: keyof Assessment; label: string; group: string }[] = [
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

export default function BeoordelingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [scores, setScores] = useState<Record<string, string>>({})
  const [coachNotes, setCoachNotes] = useState('')
  const [developmentAdvice, setDevelopmentAdvice] = useState('')
  const [sharedWithPlayer, setSharedWithPlayer] = useState(false)

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Assessment')
        .select('*, Player(first_name, last_name), Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Beoordeling niet gevonden')
        setLoading(false)
        return
      }
      const a = data as Assessment
      setAssessment(a)
      const initial: Record<string, string> = {}
      for (const f of scoreFields) {
        const v = a[f.key]
        initial[f.key as string] = v == null ? '' : String(v)
      }
      setScores(initial)
      setCoachNotes(a.coach_notes ?? '')
      setDevelopmentAdvice(a.development_advice ?? '')
      setSharedWithPlayer(a.shared_with_player)
      setLoading(false)
    }
    load()
  }, [])

  function setScore(key: string, value: string) {
    setScores(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!assessment) return
    setSaving(true)
    setError('')

    const numericScores: Record<string, number | null> = {}
    for (const { key } of scoreFields) {
      const raw = scores[key as string]
      numericScores[key as string] = raw === undefined || raw === '' ? null : Number(raw)
    }

    const { error: updateError } = await supabase.from('Assessment').update({
      ...numericScores,
      coach_notes: coachNotes || null,
      development_advice: developmentAdvice || null,
      shared_with_player: sharedWithPlayer,
    }).eq('id', assessment.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    setSaving(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!assessment) return
    if (!confirm('Weet je zeker dat je deze beoordeling wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Assessment').delete().eq('id', assessment.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/beoordelingen')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Beoordeling laden...</p>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/beoordelingen"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar beoordelingen
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Beoordeling niet gevonden.'}
        </p>
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
        href="/dashboard/beoordelingen"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar beoordelingen
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {assessment.Player?.first_name} {assessment.Player?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Beoordeling van {formatDate(assessment.date)} · {assessment.Team?.name}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? 'Bezig...' : 'Verwijderen'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Beoordelaar</p>
          <p className="text-sm text-gray-900">{assessment.assessor_name || assessment.assessor_email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Seizoen</p>
          <p className="text-sm text-gray-900">{assessment.Season?.name || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Gedeeld met speler</p>
          <p className="text-sm text-gray-900">{assessment.shared_with_player ? 'Ja' : 'Nee'}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {Object.entries(grouped).map(([group, fields]) => (
          <div key={group} className="pt-2 border-t border-gray-50 first:border-t-0 first:pt-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{group}</h3>
            <div className="grid grid-cols-3 gap-4">
              {fields.map(f => (
                <div key={f.key as string}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={scores[f.key as string] ?? ''}
                    onChange={e => setScore(f.key as string, e.target.value)}
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
