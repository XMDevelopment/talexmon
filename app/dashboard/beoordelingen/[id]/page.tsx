'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
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
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

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
      setAssessment(data as Assessment)
      setLoading(false)
    }
    load()
  }, [])

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

  const radarPoints = useMemo(() => {
    if (!assessment) return []
    return scoreFields.map(f => ({
      label: f.label,
      group: f.group,
      value: (assessment[f.key] as number | null) ?? 0,
    }))
  }, [assessment])

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
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/beoordelingen/${assessment.id}/bewerken`}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <Pencil size={14} />
            Bewerken
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
            {deleting ? 'Bezig...' : 'Verwijderen'}
          </button>
        </div>
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

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Score-overzicht</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <RadarChart points={radarPoints} />
          <div className="flex-1 w-full grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {Object.entries(grouped).map(([group, fields]) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{group}</p>
                {fields.map(f => {
                  const v = assessment[f.key] as number | null
                  return (
                    <div key={f.key as string} className="flex items-center justify-between py-0.5">
                      <span className="text-gray-600">{f.label}</span>
                      <span className="font-medium text-gray-900 tabular-nums">
                        {v == null ? <span className="text-gray-300">—</span> : v.toFixed(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(assessment.coach_notes || assessment.development_advice) && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          {assessment.coach_notes && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Coach-notities</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{assessment.coach_notes}</p>
            </div>
          )}
          {assessment.development_advice && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Ontwikkeladvies</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{assessment.development_advice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RadarChart({ points }: { points: { label: string; value: number }[] }) {
  const size = 280
  const center = size / 2
  const max = 10
  const radius = center - 36
  const n = points.length
  if (n === 0) return null

  function pointAt(value: number, idx: number) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    const r = (Math.max(0, Math.min(max, value)) / max) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  function gridAt(idx: number, scale: number) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    return {
      x: center + radius * scale * Math.cos(angle),
      y: center + radius * scale * Math.sin(angle),
    }
  }

  const dataPath = points
    .map((p, i) => {
      const { x, y } = pointAt(p.value, i)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + ' Z'

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {gridLevels.map(scale => (
        <polygon
          key={scale}
          points={points
            .map((_, i) => {
              const { x, y } = gridAt(i, scale)
              return `${x.toFixed(1)},${y.toFixed(1)}`
            })
            .join(' ')}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      ))}
      {points.map((_, i) => {
        const { x, y } = gridAt(i, 1)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        )
      })}
      <path d={dataPath} fill="rgba(22, 163, 74, 0.18)" stroke="#16a34a" strokeWidth={1.5} />
      {points.map((p, i) => {
        const { x, y } = pointAt(p.value, i)
        return <circle key={`pt-${i}`} cx={x} cy={y} r={2.5} fill="#16a34a" />
      })}
      {points.map((p, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const lx = center + (radius + 18) * Math.cos(angle)
        const ly = center + (radius + 18) * Math.sin(angle)
        return (
          <text
            key={`lbl-${i}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-500"
            style={{ fontSize: 9 }}
          >
            {p.label}
          </text>
        )
      })}
    </svg>
  )
}
