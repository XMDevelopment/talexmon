'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
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

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const [training, setTraining] = useState<Training | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Training')
        .select('*, Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError) setError(loadError.message)
      else setTraining(data as Training)
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
            {formatDate(training.date)}{training.time ? ` · ${training.time}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
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
        <Field label="Thema" value={training.theme} />
        <Field label="Notities" value={training.notes} multiline />
        <div>
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[training.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
          </span>
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
