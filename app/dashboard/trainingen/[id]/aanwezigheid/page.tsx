'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

type Training = {
  id: string
  team_id: string
  season_id: string
  date: string
  time: string | null
  theme: string | null
  Team?: { name: string } | null
}

type Player = {
  id: string
  first_name: string
  last_name: string
  position: string
}

type AttendanceRow = {
  id?: string
  training_id: string
  player_id: string
  team_id: string
  season_id: string
  present: boolean
  reason_absent: string | null
}

export default function AanwezigheidPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [trainingId, setTrainingId] = useState('')
  const [training, setTraining] = useState<Training | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [rows, setRows] = useState<Record<string, AttendanceRow>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { id } = await params
      setTrainingId(id)

      const { data: t, error: tErr } = await supabase
        .from('Training')
        .select('id, team_id, season_id, date, time, theme, Team(name)')
        .eq('id', id)
        .single()

      if (tErr || !t) {
        setError(tErr?.message ?? 'Training niet gevonden')
        setLoaded(true)
        return
      }
      setTraining(t as unknown as Training)

      const [{ data: p }, { data: a }] = await Promise.all([
        supabase
          .from('Player')
          .select('id, first_name, last_name, position')
          .eq('team_id', (t as unknown as Training).team_id)
          .order('last_name'),
        supabase
          .from('TrainingAttendance')
          .select('*')
          .eq('training_id', id),
      ])

      const playerList = (p as Player[]) ?? []
      setPlayers(playerList)

      const existing: Record<string, AttendanceRow> = {}
      for (const att of (a as AttendanceRow[]) ?? []) {
        existing[att.player_id] = att
      }
      for (const pl of playerList) {
        if (!existing[pl.id]) {
          existing[pl.id] = {
            training_id: id,
            player_id: pl.id,
            team_id: (t as unknown as Training).team_id,
            season_id: (t as unknown as Training).season_id,
            present: true,
            reason_absent: null,
          }
        }
      }
      setRows(existing)
      setLoaded(true)
    }
    load()
  }, [])

  const counts = useMemo(() => {
    const list = Object.values(rows)
    return {
      total: list.length,
      present: list.filter(r => r.present).length,
      absent: list.filter(r => !r.present).length,
    }
  }, [rows])

  function togglePresent(playerId: string, present: boolean) {
    setRows(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        present,
        reason_absent: present ? null : prev[playerId].reason_absent,
      },
    }))
  }

  function setReason(playerId: string, reason: string) {
    setRows(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], reason_absent: reason || null },
    }))
  }

  function setAllPresent(present: boolean) {
    setRows(prev => {
      const next: Record<string, AttendanceRow> = {}
      for (const [key, val] of Object.entries(prev)) {
        next[key] = { ...val, present, reason_absent: present ? null : val.reason_absent }
      }
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSavedAt(null)

    const payload = Object.values(rows).map(r => ({
      training_id: r.training_id,
      player_id: r.player_id,
      team_id: r.team_id,
      season_id: r.season_id,
      present: r.present,
      reason_absent: r.reason_absent,
    }))

    const { error: upsertError } = await supabase
      .from('TrainingAttendance')
      .upsert(payload, { onConflict: 'training_id,player_id' })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }
    setSavedAt(new Date().toLocaleTimeString('nl-NL'))
    setSaving(false)
  }

  if (!loaded) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Aanwezigheid laden...</p>
      </div>
    )
  }

  if (error && !training) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/trainingen"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar trainingen
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href={`/dashboard/trainingen/${trainingId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar training
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aanwezigheid</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {training?.Team?.name} · {training ? formatDate(training.date) : ''}
            {training?.time ? ` · ${training.time}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllPresent(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Allen aanwezig
          </button>
          <button
            type="button"
            onClick={() => setAllPresent(false)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Allen afwezig
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Spelers</p>
          <p className="text-xl font-semibold text-gray-900">{counts.total}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Aanwezig</p>
          <p className="text-xl font-semibold text-green-600">{counts.present}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-500">Afwezig</p>
          <p className="text-xl font-semibold text-red-600">{counts.absent}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {players.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">Geen spelers gekoppeld aan dit team.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Speler</th>
                <th className="text-left px-5 py-3 font-medium">Positie</th>
                <th className="text-left px-5 py-3 font-medium w-40">Status</th>
                <th className="text-left px-5 py-3 font-medium">Reden afwezigheid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {players.map(p => {
                const row = rows[p.id]
                if (!row) return null
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {p.first_name} {p.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 capitalize">{p.position}</td>
                    <td className="px-5 py-3">
                      <div className="inline-flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => togglePresent(p.id, true)}
                          className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 transition-colors ${row.present ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Check size={12} />
                          Aanwezig
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePresent(p.id, false)}
                          className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 transition-colors ${!row.present ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          <X size={12} />
                          Afwezig
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={row.reason_absent ?? ''}
                        onChange={e => setReason(p.id, e.target.value)}
                        disabled={row.present}
                        placeholder={row.present ? '—' : 'bv. ziek, blessure, vakantie'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-300"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>
      )}

      <div className="flex items-center justify-between mt-6">
        <p className="text-xs text-gray-400">
          {savedAt ? `Laatst opgeslagen om ${savedAt}` : 'Wijzigingen worden pas opgeslagen na klikken.'}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/trainingen/${trainingId}`}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || players.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Bezig...' : 'Aanwezigheid opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
