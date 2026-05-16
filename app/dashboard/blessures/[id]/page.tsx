'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
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
  Player?: { first_name: string; last_name: string } | null
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
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [statusVal, setStatusVal] = useState<'actief' | 'hersteld'>('actief')
  const [expectedReturn, setExpectedReturn] = useState('')
  const [actualReturn, setActualReturn] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      const { id } = await params
      const { data, error: loadError } = await supabase
        .from('Injury')
        .select('*, Player(first_name, last_name), Team(name), Season(name)')
        .eq('id', id)
        .single()
      if (loadError || !data) {
        setError(loadError?.message ?? 'Blessure niet gevonden')
        setLoading(false)
        return
      }
      const inj = data as Injury
      setInjury(inj)
      setStatusVal(inj.status)
      setExpectedReturn(inj.expected_return ?? '')
      setActualReturn(inj.actual_return ?? '')
      setNotes(inj.notes ?? '')
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!injury) return
    setSaving(true)
    setError('')
    const { error: updateError } = await supabase.from('Injury').update({
      status: statusVal,
      expected_return: expectedReturn || null,
      actual_return: actualReturn || null,
      notes: notes || null,
    }).eq('id', injury.id)
    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }
    setInjury({ ...injury, status: statusVal, expected_return: expectedReturn || null, actual_return: actualReturn || null, notes: notes || null })
    setSaving(false)
  }

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
            <p className="text-xs text-gray-500 mb-1">Team</p>
            <p className="text-sm text-gray-900">{injury.Team?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Seizoen</p>
            <p className="text-sm text-gray-900">{injury.Season?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Ernst</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColors[injury.severity]}`}>
              {injury.severity.charAt(0).toUpperCase() + injury.severity.slice(1)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">E-mail speler</p>
            <p className="text-sm text-gray-900">{injury.player_email || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">E-mail ouder</p>
            <p className="text-sm text-gray-900">{injury.parent_email || '—'}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Toestemming AVG</p>
          <p className="text-sm text-gray-900">
            {injury.consent_given
              ? `Gegeven ${injury.consent_given_at ? `op ${formatDate(injury.consent_given_at)}` : ''}`
              : 'Niet gegeven'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Voortgang bijwerken</h2>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusVal}
              onChange={e => setStatusVal(e.target.value as typeof statusVal)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="actief">Actief</option>
              <option value="hersteld">Hersteld</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verwacht terug</label>
            <input
              type="date"
              value={expectedReturn}
              onChange={e => setExpectedReturn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hersteld op</label>
            <input
              type="date"
              value={actualReturn}
              onChange={e => setActualReturn(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notities</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[injury.status]}`}>
            Huidige status: {injury.status === 'actief' ? 'Actief' : 'Hersteld'}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Bezig...' : 'Opslaan'}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </form>
    </div>
  )
}
