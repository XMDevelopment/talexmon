'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getAge, positionLabels, statusColors } from '@/lib/utils'

type Player = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  position: string
  dominant_foot: string | null
  status: string
  team_id: string | null
  season_id: string | null
  player_email: string | null
  player_phone: string | null
  parent_email: string | null
  parent_phone: string | null
  address: string | null
  is_minor: boolean
  talent_label: string
  consent_data_processing: boolean
  consent_data_processing_at: string | null
  Team?: { name: string } | null
  Season?: { name: string } | null
}

const talentLabels: Record<string, string> = {
  geen: 'Geen', talent: 'Talent', groot_talent: 'Groot talent', doorstroom: 'Doorstroom',
}

export default function SpelerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Player')
        .select('*, Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Speler niet gevonden')
        setLoading(false)
        return
      }
      setPlayer(data as Player)
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete() {
    if (!player) return
    if (!confirm('Weet je zeker dat je deze speler wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Player').delete().eq('id', player.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/spelers')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Speler laden...</p>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/spelers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar spelers
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Speler niet gevonden.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/spelers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar spelers
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-semibold text-sm">
              {player.first_name.charAt(0)}{player.last_name.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{player.first_name} {player.last_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {positionLabels[player.position] ?? player.position} · {getAge(player.date_of_birth)} jaar
              {player.Team?.name ? ` · ${player.Team.name}` : ''}
            </p>
          </div>
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

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Team" value={player.Team?.name} />
          <Field label="Seizoen" value={player.Season?.name} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[player.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Geboortedatum" value={formatDate(player.date_of_birth)} />
          <Field label="Sterke voet" value={player.dominant_foot ? player.dominant_foot.charAt(0).toUpperCase() + player.dominant_foot.slice(1) : null} />
          <Field label="Talentlabel" value={talentLabels[player.talent_label] ?? player.talent_label} />
        </div>
        <Field label="Adres" value={player.address} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="E-mail speler" value={player.player_email} />
          <Field label="Telefoon speler" value={player.player_phone} />
        </div>
        {player.is_minor && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="E-mail ouder" value={player.parent_email} />
              <Field label="Telefoon ouder" value={player.parent_phone} />
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              Speler is minderjarig — oudergegevens vereist.
            </p>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">AVG</h2>
        <p className="text-sm text-gray-900">
          {player.consent_data_processing
            ? `Toestemming gegevensverwerking gegeven${player.consent_data_processing_at ? ` op ${formatDate(player.consent_data_processing_at)}` : ''}.`
            : 'Geen toestemming geregistreerd.'}
        </p>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  )
}
