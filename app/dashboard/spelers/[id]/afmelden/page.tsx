'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type Player = {
  id: string
  first_name: string
  last_name: string
  team_id: string | null
  season_id: string | null
  Team?: { name: string } | null
  Season?: { name: string } | null
}

export default function AfmeldenPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [playerId, setPlayerId] = useState('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<'training' | 'wedstrijd' | 'beide'>('beide')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      setPlayerId(id)
      const { data, error: loadError } = await supabase
        .from('Player')
        .select('id, first_name, last_name, team_id, season_id, Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Speler niet gevonden')
        setLoaded(true)
        return
      }
      setPlayer(data as unknown as Player)
      setLoaded(true)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!player) return
    if (!player.team_id || !player.season_id) {
      setError('Speler heeft geen team of seizoen — eerst koppelen voordat afmelden mogelijk is.')
      return
    }
    setSaving(true)
    setError('')

    const { error: insertError } = await supabase.from('PlayerAbsence').insert({
      player_id: player.id,
      team_id: player.team_id,
      season_id: player.season_id,
      type,
      date_from: dateFrom,
      date_to: dateTo || null,
      reason: reason || null,
      notes: notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    router.push(`/dashboard/spelers/${player.id}`)
    router.refresh()
  }

  if (!loaded) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-sm text-gray-400">Speler laden...</p>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Link
          href="/dashboard/spelers"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar spelers
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error || 'Speler niet gevonden.'}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/dashboard/spelers/${playerId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar speler
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Speler afmelden</h1>
      <p className="text-sm text-gray-500 mb-6">
        Registreer afwezigheid voor <span className="font-medium text-gray-900">{player.first_name} {player.last_name}</span>
        {player.Team?.name ? ` (${player.Team.name})` : ''}
      </p>

      {(!player.team_id || !player.season_id) && (
        <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4">
          Let op: deze speler heeft nog geen team of seizoen toegewezen. Afmelden kan pas nadat dit is ingevuld op het spelersprofiel.
        </p>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
          <div className="flex gap-2">
            {(['training', 'wedstrijd', 'beide'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  type === t
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'training' ? 'Training' : t === 'wedstrijd' ? 'Wedstrijd' : 'Beide'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vanaf datum *</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tot en met datum</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              min={dateFrom || undefined}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-1">Laat leeg voor een afmelding op één dag.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reden</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="bv. ziek, vakantie, blessure, school"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
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

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <p className="text-xs text-gray-400">
            Geregistreerd in seizoen {player.Season?.name ?? '—'}
            {dateFrom && ` vanaf ${formatDate(dateFrom)}`}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/spelers/${playerId}`}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              Annuleren
            </Link>
            <button
              type="submit"
              disabled={saving || !player.team_id || !player.season_id}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Bezig...' : 'Afmelding opslaan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
