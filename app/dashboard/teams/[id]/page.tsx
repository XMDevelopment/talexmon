'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, getAge, positionLabels, statusColors } from '@/lib/utils'

type Team = {
  id: string
  name: string
  age_category: string | null
  age_category_id: string | null
  level: 'selectie' | 'recreatief'
  season_id: string
  coach_emails: string[]
  knvb_ical_url: string | null
  knvb_team_code: string | null
  last_sync_at: string | null
  last_sync_status: 'ok' | 'error' | 'never'
  last_sync_error: string | null
  Season?: { name: string } | null
  AgeCategory?: { label: string } | null
}

type PlayerRow = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  position: string
  status: string
}

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const [{ data: t, error: tErr }, { data: p }] = await Promise.all([
        supabase
          .from('Team')
          .select('*, Season(name), AgeCategory(label)')
          .eq('id', id)
          .single(),
        supabase
          .from('Player')
          .select('id, first_name, last_name, date_of_birth, position, status')
          .eq('team_id', id)
          .order('last_name'),
      ])
      if (tErr || !t) {
        setError(tErr?.message ?? 'Team niet gevonden')
        setLoading(false)
        return
      }
      setTeam(t as Team)
      setPlayers((p as PlayerRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete() {
    if (!team) return
    if (!confirm('Weet je zeker dat je dit team wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Team').delete().eq('id', team.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/teams')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Team laden...</p>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/teams"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar teams
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Team niet gevonden.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar teams
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">{team.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{team.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {team.AgeCategory?.label ?? team.age_category ?? '—'} · {team.Season?.name ?? '—'}
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

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Niveau</p>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${team.level === 'selectie' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
              {team.level === 'selectie' ? 'Selectie' : 'Recreatief'}
            </span>
          </div>
          <Field label="Leeftijdscategorie" value={team.AgeCategory?.label ?? team.age_category} />
          <Field label="Seizoen" value={team.Season?.name} />
        </div>
        <Field label="Coaches" value={team.coach_emails.length > 0 ? team.coach_emails.join(', ') : null} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="KNVB iCal" value={team.knvb_ical_url} />
          <Field label="KNVB teamcode" value={team.knvb_team_code} />
        </div>
        {team.last_sync_status !== 'never' && (
          <div className="pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-500 mb-1">KNVB sync</p>
            <p className={`text-sm ${team.last_sync_status === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
              {team.last_sync_status === 'ok' ? 'Geslaagd' : 'Fout'}
              {team.last_sync_at ? ` · ${formatDate(team.last_sync_at)}` : ''}
              {team.last_sync_error ? ` — ${team.last_sync_error}` : ''}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Spelers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {players.length === 0 ? 'Nog geen spelers gekoppeld' : `${players.length} speler${players.length === 1 ? '' : 's'}`}
          </p>
        </div>
        {players.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-2 font-medium">Naam</th>
                <th className="text-left px-5 py-2 font-medium">Positie</th>
                <th className="text-left px-5 py-2 font-medium">Leeftijd</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {players.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-2 text-sm font-medium text-gray-900">
                    <Link href={`/dashboard/spelers/${p.id}`} className="hover:text-green-600">
                      {p.first_name} {p.last_name}
                    </Link>
                  </td>
                  <td className="px-5 py-2 text-sm text-gray-600">{positionLabels[p.position] ?? p.position}</td>
                  <td className="px-5 py-2 text-sm text-gray-600">{getAge(p.date_of_birth)} jaar</td>
                  <td className="px-5 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Geen spelers in dit team.</p>
        )}
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
