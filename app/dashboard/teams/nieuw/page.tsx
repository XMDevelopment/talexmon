'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Season = { id: string; name: string }
type AgeCategory = { id: string; code: string; label: string }

export default function NieuwTeamPage() {
  const router = useRouter()
  const supabase = createClient()

  const [seasons, setSeasons] = useState<Season[]>([])
  const [categories, setCategories] = useState<AgeCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [ageCategoryId, setAgeCategoryId] = useState('')
  const [level, setLevel] = useState<'selectie' | 'recreatief'>('selectie')
  const [coachEmails, setCoachEmails] = useState('')
  const [knvbIcalUrl, setKnvbIcalUrl] = useState('')
  const [knvbTeamCode, setKnvbTeamCode] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.from('Season').select('id, name').order('start_date', { ascending: false }),
        supabase.from('AgeCategory').select('id, code, label').eq('active', true).order('sort_order'),
      ])
      setSeasons((s as Season[]) ?? [])
      setCategories((c as AgeCategory[]) ?? [])
      const activeSeason = (s as Season[])?.[0]
      if (activeSeason) setSeasonId(activeSeason.id)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const emails = coachEmails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(Boolean)

    const selectedCategory = categories.find(c => c.id === ageCategoryId)

    const { error: insertError } = await supabase.from('Team').insert({
      name,
      season_id: seasonId,
      age_category_id: ageCategoryId || null,
      age_category: selectedCategory?.code ?? null,
      level,
      coach_emails: emails,
      knvb_ical_url: knvbIcalUrl || null,
      knvb_team_code: knvbTeamCode || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/teams')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/teams"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar teams
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nieuw team</h1>
      <p className="text-sm text-gray-500 mb-6">Maak een team aan voor het huidige of een nieuw seizoen.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teamnaam *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="bv. JO13-1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value as typeof level)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="selectie">Selectie</option>
              <option value="recreatief">Recreatief</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leeftijdscategorie</label>
          <select
            value={ageCategoryId}
            onChange={e => setAgeCategoryId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">—</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coach e-mailadressen</label>
          <textarea
            value={coachEmails}
            onChange={e => setCoachEmails(e.target.value)}
            rows={2}
            placeholder="Eén per regel of komma-gescheiden"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KNVB iCal URL</label>
            <input
              type="url"
              value={knvbIcalUrl}
              onChange={e => setKnvbIcalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KNVB teamcode</label>
            <input
              type="text"
              value={knvbTeamCode}
              onChange={e => setKnvbTeamCode(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
          <Link
            href="/dashboard/teams"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Team opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
