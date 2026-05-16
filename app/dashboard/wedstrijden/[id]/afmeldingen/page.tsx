'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type Match = {
  id: string
  team_id: string
  season_id: string
  date: string
  time: string | null
  opponent: string
  home_away: 'thuis' | 'uit'
  Team?: { name: string } | null
}

type Absence = {
  id: string
  player_id: string
  type: 'training' | 'wedstrijd' | 'beide'
  date_from: string
  date_to: string | null
  reason: string | null
  notes: string | null
  Player?: { first_name: string; last_name: string; position: string } | null
}

const typeLabels: Record<Absence['type'], string> = {
  training: 'Training',
  wedstrijd: 'Wedstrijd',
  beide: 'Beide',
}

const typeColors: Record<Absence['type'], string> = {
  training: 'bg-purple-50 text-purple-700',
  wedstrijd: 'bg-blue-50 text-blue-700',
  beide: 'bg-amber-50 text-amber-700',
}

export default function MatchAfmeldingenPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient()
  const [matchId, setMatchId] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [absences, setAbsences] = useState<Absence[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      setMatchId(id)

      const { data: m, error: mErr } = await supabase
        .from('Match')
        .select('id, team_id, season_id, date, time, opponent, home_away, Team(name)')
        .eq('id', id)
        .single()

      if (mErr || !m) {
        setError(mErr?.message ?? 'Wedstrijd niet gevonden')
        setLoading(false)
        return
      }

      const matchData = m as unknown as Match
      setMatch(matchData)

      const { data: a, error: aErr } = await supabase
        .from('PlayerAbsence')
        .select('id, player_id, type, date_from, date_to, reason, notes, Player(first_name, last_name, position)')
        .eq('team_id', matchData.team_id)
        .in('type', ['wedstrijd', 'beide'])
        .lte('date_from', matchData.date)
        .or(`date_to.is.null,date_to.gte.${matchData.date}`)
        .order('date_from', { ascending: false })

      if (aErr) setError(aErr.message)
      setAbsences((a as unknown as Absence[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Afmeldingen laden...</p>
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
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error || 'Wedstrijd niet gevonden.'}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/wedstrijden/${matchId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar wedstrijd
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Afmeldingen</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {match.Team?.name} vs {match.opponent} · {formatDate(match.date)}
          {match.time ? ` · ${match.time}` : ''} · {match.home_away === 'thuis' ? 'Thuis' : 'Uit'}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-900">
            {absences.length === 0 ? 'Geen afmeldingen' : `${absences.length} speler${absences.length === 1 ? '' : 's'} afwezig`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Toont actieve afmeldingen op {formatDate(match.date)} voor team &ldquo;{match.Team?.name}&rdquo;.
          </p>
        </div>
        {absences.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">
            Geen spelers hebben zich afgemeld voor deze wedstrijd.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Speler</th>
                <th className="text-left px-5 py-3 font-medium">Positie</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Periode</th>
                <th className="text-left px-5 py-3 font-medium">Reden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {absences.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/dashboard/spelers/${a.player_id}`} className="hover:text-green-600">
                      {a.Player?.first_name} {a.Player?.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 capitalize">{a.Player?.position ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeColors[a.type]}`}>
                      {typeLabels[a.type]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {formatDate(a.date_from)}
                    {a.date_to ? ` t/m ${formatDate(a.date_to)}` : ''}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {a.reason || <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
