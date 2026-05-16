'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Team = { id: string; name: string; season_id: string }
type Season = { id: string; name: string }

export default function NieuweTrainingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(90)
  const [location, setLocation] = useState('')
  const [theme, setTheme] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'gepland' | 'afgerond' | 'geannuleerd'>('gepland')

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }] = await Promise.all([
        supabase.from('Team').select('id, name, season_id').order('name'),
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
      ])
      setTeams((t as Team[]) ?? [])
      setSeasons((s as Season[]) ?? [])
      const activeSeason = (s as Season[])?.[0]
      if (activeSeason) setSeasonId(activeSeason.id)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('Training').insert({
      team_id: teamId,
      season_id: seasonId,
      date,
      time: time || null,
      duration_minutes: durationMinutes,
      location: location || null,
      theme: theme || null,
      notes: notes || null,
      status,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/trainingen')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/trainingen"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar trainingen
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nieuwe training</h1>
      <p className="text-sm text-gray-500 mb-6">Plan een nieuwe training in voor een team.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tijd</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duur (min)</label>
            <input
              type="number"
              min={15}
              max={300}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="bv. Sportpark De Eendracht, veld 3"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thema</label>
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="bv. Passen en aannemen"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as typeof status)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="gepland">Gepland</option>
            <option value="afgerond">Afgerond</option>
            <option value="geannuleerd">Geannuleerd</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
          <Link
            href="/dashboard/trainingen"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Training opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
