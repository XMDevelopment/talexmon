'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, statusColors } from '@/lib/utils'

type Injury = {
  id: string
  player_id: string
  team_id: string
  season_id: string
  injury_type: string
  severity: 'licht' | 'matig' | 'ernstig'
  status: 'actief' | 'hersteld'
  start_date: string
  expected_return: string | null
  actual_return: string | null
  notes: string | null
  player_email: string | null
  parent_email: string | null
  consent_given: boolean
  consent_given_at: string | null
  Player?: { id: string; first_name: string; last_name: string } | null
  Team?: { name: string } | null
  Season?: { name: string } | null
}

const injuryLabels: Record<string, string> = {
  spierblessure: 'Spierblessure', knieblessure: 'Knieblessure',
  enkelblessure: 'Enkelblessure', hamstring: 'Hamstring',
  lies: 'Lies', rug: 'Rug', hoofd: 'Hoofd', breuk: 'Breuk', overig: 'Overig',
}

const severityColors: Record<string, string> = {
  licht: 'bg-green-50 text-green-700',
  matig: 'bg-amber-50 text-amber-700',
  ernstig: 'bg-red-50 text-red-700',
}

export default function BlessureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [injury, setInjury] = useState<Injury | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Injury')
        .select('*, Player(id, first_name, last_name), Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Blessure niet gevonden')
        setLoading(false)
        return
      }
      setInjury(data as Injury)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete() {
    if (!injury) return
    if (!confirm('Weet je zeker dat je deze blessure wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Injury').delete().eq('id', injury.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/blessures')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Blessure laden...</p>
      </div>
    )
  }

  if (error || !injury) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/blessures"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar blessures
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Blessure niet gevonden.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/blessures"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar blessures
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {injury.Player?.first_name} {injury.Player?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {injuryLabels[injury.injury_type] ?? injury.injury_type} · sinds {formatDate(injury.start_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/blessures/${injury.id}/bewerken`}
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

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Team" value={injury.Team?.name} />
          <Field label="Seizoen" value={injury.Season?.name} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[injury.status]}`}>
              {injury.status === 'actief' ? 'Actief' : 'Hersteld'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Type blessure" value={injuryLabels[injury.injury_type] ?? injury.injury_type} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Ernst</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColors[injury.severity]}`}>
              {injury.severity.charAt(0).toUpperCase() + injury.severity.slice(1)}
            </span>
          </div>
          <Field label="Startdatum" value={formatDate(injury.start_date)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Verwacht terug" value={injury.expected_return ? formatDate(injury.expected_return) : null} />
          <Field label="Hersteld op" value={injury.actual_return ? formatDate(injury.actual_return) : null} />
        </div>
        <Field label="Notities" value={injury.notes} multiline />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Contact & AVG</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="E-mail speler" value={injury.player_email} />
          <Field label="E-mail ouder" value={injury.parent_email} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Toestemming AVG</p>
          <p className="text-sm text-gray-900">
            {injury.consent_given
              ? `Gegeven${injury.consent_given_at ? ` op ${formatDate(injury.consent_given_at)}` : ''}`
              : 'Niet gegeven'}
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value: string | null | undefined; multiline?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  )
}
