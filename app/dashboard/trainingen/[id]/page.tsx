'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Check, X, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, statusColors } from '@/lib/utils'

type Training = {
  id: string
  team_id: string
  season_id: string
  date: string
  time: string | null
  duration_minutes: number | null
  location: string | null
  theme: string | null
  notes: string | null
  status: 'gepland' | 'afgerond' | 'geannuleerd'
  Team?: { name: string } | null
  Season?: { name: string } | null
}

type AttendanceRow = {
  id: string
  present: boolean
  reason_absent: string | null
  Player?: { id: string; first_name: string; last_name: string } | null
}

type DrillRow = {
  id: string
  order: number | null
  duration_minutes: number | null
  notes: string | null
  DrillLibrary?: { name: string; category: string; difficulty: string } | null
}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [training, setTraining] = useState<Training | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRow[]>([])
  const [drills, setDrills] = useState<DrillRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const [{ data: t, error: tErr }, { data: a }, { data: d }] = await Promise.all([
        supabase
          .from('Training')
          .select('*, Team(name), Season(name)')
          .eq('id', id)
          .single(),
        supabase
          .from('TrainingAttendance')
          .select('id, present, reason_absent, Player(id, first_name, last_name)')
          .eq('training_id', id),
        supabase
          .from('TrainingDrill')
          .select('id, order, duration_minutes, notes, DrillLibrary(name, category, difficulty)')
          .eq('training_id', id)
          .order('order'),
      ])
      if (tErr) setError(tErr.message)
      else setTraining(t as Training)
      setAttendance((a as unknown as AttendanceRow[]) ?? [])
      setDrills((d as unknown as DrillRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete() {
    if (!training) return
    if (!confirm('Weet je zeker dat je deze training wilt verwijderen?')) return
    setDeleting(true)
    const { error: deleteError } = await supabase.from('Training').delete().eq('id', training.id)
    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }
    router.push('/dashboard/trainingen')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-sm text-gray-400">Training laden...</p>
      </div>
    )
  }

  if (error || !training) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/trainingen"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={14} />
          Terug naar trainingen
        </Link>
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error || 'Training niet gevonden.'}
        </p>
      </div>
    )
  }

  const presentCount = attendance.filter(a => a.present).length
  const absentCount = attendance.filter(a => !a.present).length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/trainingen"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar trainingen
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{training.theme || 'Training'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {training.Team?.name} · {formatDate(training.date)}{training.time ? ` · ${training.time}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/trainingen/${training.id}/aanwezigheid`}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <ClipboardList size={14} />
            Aanwezigheid
          </Link>
          <Link
            href={`/dashboard/trainingen/${training.id}/bewerken`}
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
        <div className="grid grid-cols-2 gap-4">
          <Field label="Team" value={training.Team?.name} />
          <Field label="Seizoen" value={training.Season?.name} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Datum" value={formatDate(training.date)} />
          <Field label="Tijd" value={training.time} />
          <Field label="Duur" value={training.duration_minutes ? `${training.duration_minutes} min` : null} />
        </div>
        <Field label="Locatie" value={training.location} />
        <Field label="Notities" value={training.notes} multiline />
        <div>
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[training.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Aanwezigheid</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {attendance.length === 0
                ? 'Nog geen aanwezigheid geregistreerd'
                : `${presentCount} aanwezig · ${absentCount} afwezig`}
            </p>
          </div>
          <Link
            href={`/dashboard/trainingen/${training.id}/aanwezigheid`}
            className="text-xs font-medium text-green-700 hover:text-green-800"
          >
            {attendance.length === 0 ? 'Registreren' : 'Bijwerken'} →
          </Link>
        </div>
        {attendance.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-2 font-medium">Speler</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
                <th className="text-left px-5 py-2 font-medium">Reden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendance.map(a => (
                <tr key={a.id}>
                  <td className="px-5 py-2 text-sm text-gray-900">
                    {a.Player?.first_name} {a.Player?.last_name}
                  </td>
                  <td className="px-5 py-2">
                    {a.present ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                        <Check size={12} /> Aanwezig
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <X size={12} /> Afwezig
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-2 text-xs text-gray-500">
                    {a.reason_absent || (a.present ? '—' : <span className="text-gray-300">—</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Oefeningen</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {drills.length === 0 ? 'Nog geen oefeningen toegevoegd' : `${drills.length} oefening${drills.length === 1 ? '' : 'en'}`}
          </p>
        </div>
        {drills.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-50">
                <th className="text-left px-5 py-2 font-medium w-10">#</th>
                <th className="text-left px-5 py-2 font-medium">Oefening</th>
                <th className="text-left px-5 py-2 font-medium">Categorie</th>
                <th className="text-left px-5 py-2 font-medium">Duur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {drills.map((d, idx) => (
                <tr key={d.id}>
                  <td className="px-5 py-2 text-sm text-gray-400">{d.order ?? idx + 1}</td>
                  <td className="px-5 py-2 text-sm text-gray-900">{d.DrillLibrary?.name ?? '—'}</td>
                  <td className="px-5 py-2 text-sm text-gray-600 capitalize">{d.DrillLibrary?.category?.replace('_', ' ') ?? '—'}</td>
                  <td className="px-5 py-2 text-sm text-gray-600">{d.duration_minutes ? `${d.duration_minutes} min` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Geen oefeningen gekoppeld.</p>
        )}
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
