'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, statusColors } from '@/lib/utils'

type Match = {
  id: string
  team_id: string
  season_id: string
  date: string
  time: string | null
  location: string | null
  opponent: string
  home_away: 'thuis' | 'uit'
  status: 'gepland' | 'gespeeld' | 'afgelast'
  goals_for: number | null
  goals_against: number | null
  notes: string | null
  lineup_published: boolean
  competition_name: string | null
  match_number: string | null
  external_source: string
  Team?: { name: string } | null
  Season?: { name: string } | null
}

export default function WedstrijdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Match')
        .select('*, Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Wedstrijd niet gevonden')
        setLoading(false)
        return
      }
      setMatch(data as Match)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete() {
    if (!match) return
    if (!confirm('Weet je zeker dat je deze wedstrijd wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Match').delete().eq('id', match.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/wedstrijden')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Wedstrijd laden...</p>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/wedstrijden"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar wedstrijden
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Wedstrijd niet gevonden.'}
        </p>
      </div>
    )
  }

  const hasScore = match.goals_for !== null && match.goals_against !== null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/wedstrijden"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar wedstrijden
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {match.Team?.name} <span className="text-gray-400">vs</span> {match.opponent}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(match.date)}{match.time ? ` · ${match.time}` : ''} · {match.home_away === 'thuis' ? 'Thuis' : 'Uit'}
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

      {hasScore && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 text-center">
          <p className="text-xs text-gray-500 mb-2">Uitslag</p>
          <p className="text-4xl font-semibold text-gray-900 tabular-nums">
            {match.goals_for} – {match.goals_against}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Team" value={match.Team?.name} />
          <Field label="Seizoen" value={match.Season?.name} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[match.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Datum" value={formatDate(match.date)} />
          <Field label="Tijd" value={match.time} />
          <Field label="Thuis/Uit" value={match.home_away === 'thuis' ? 'Thuis' : 'Uit'} />
        </div>
        <Field label="Locatie" value={match.location} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Competitie" value={match.competition_name} />
          <Field label="Wedstrijdnr." value={match.match_number} />
        </div>
        <Field label="Notities" value={match.notes} multiline />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Opstelling gepubliceerd</p>
          <p className="text-sm text-gray-900">{match.lineup_published ? 'Ja' : 'Nee'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Bron</p>
          <p className="text-sm text-gray-900 capitalize">{match.external_source.replace('_', ' ')}</p>
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
