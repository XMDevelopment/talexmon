'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Team = { id: string; name: string; season_id: string }
type Season = { id: string; name: string }

export default function NieuweSpelerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [teams, setTeams] = useState<Team[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [position, setPosition] = useState<'keeper' | 'verdediger' | 'middenvelder' | 'aanvaller'>('middenvelder')
  const [dominantFoot, setDominantFoot] = useState<'links' | 'rechts' | 'beide' | ''>('')
  const [status, setStatus] = useState<'actief' | 'geblesseerd' | 'gestopt'>('actief')
  const [teamId, setTeamId] = useState('')
  const [seasonId, setSeasonId] = useState('')
  const [playerEmail, setPlayerEmail] = useState('')
  const [playerPhone, setPlayerPhone] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [address, setAddress] = useState('')
  const [talentLabel, setTalentLabel] = useState<'geen' | 'talent' | 'groot_talent' | 'doorstroom'>('geen')
  const [isMinor, setIsMinor] = useState(false)
  const [consentDataProcessing, setConsentDataProcessing] = useState(false)

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

    const { error: insertError } = await supabase.from('Player').insert({
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      position,
      dominant_foot: dominantFoot || null,
      status,
      team_id: teamId || null,
      season_id: seasonId || null,
      player_email: playerEmail || null,
      player_phone: playerPhone || null,
      parent_email: parentEmail || null,
      parent_phone: parentPhone || null,
      address: address || null,
      talent_label: talentLabel,
      is_minor: isMinor,
      consent_data_processing: consentDataProcessing,
      consent_data_processing_at: consentDataProcessing ? new Date().toISOString() : null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/spelers')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href="/dashboard/spelers"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={14} />
        Terug naar spelers
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nieuwe speler</h1>
      <p className="text-sm text-gray-500 mb-6">Voeg een speler toe aan een team.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Achternaam *</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Geboortedatum *</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Positie *</label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value as typeof position)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="keeper">Keeper</option>
              <option value="verdediger">Verdediger</option>
              <option value="middenvelder">Middenvelder</option>
              <option value="aanvaller">Aanvaller</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sterke voet</label>
            <select
              value={dominantFoot}
              onChange={e => setDominantFoot(e.target.value as typeof dominantFoot)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">—</option>
              <option value="links">Links</option>
              <option value="rechts">Rechts</option>
              <option value="beide">Beide</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">—</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seizoen</label>
            <select
              value={seasonId}
              onChange={e => setSeasonId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">—</option>
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="actief">Actief</option>
              <option value="geblesseerd">Geblesseerd</option>
              <option value="gestopt">Gestopt</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail speler</label>
            <input
              type="email"
              value={playerEmail}
              onChange={e => setPlayerEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon speler</label>
            <input
              type="tel"
              value={playerPhone}
              onChange={e => setPlayerPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail ouder</label>
            <input
              type="email"
              value={parentEmail}
              onChange={e => setParentEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefoon ouder</label>
            <input
              type="tel"
              value={parentPhone}
              onChange={e => setParentPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Talentlabel</label>
            <select
              value={talentLabel}
              onChange={e => setTalentLabel(e.target.value as typeof talentLabel)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="geen">Geen</option>
              <option value="talent">Talent</option>
              <option value="groot_talent">Groot talent</option>
              <option value="doorstroom">Doorstroom</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-6">
            <input
              type="checkbox"
              checked={isMinor}
              onChange={e => setIsMinor(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span>Speler is minderjarig</span>
          </label>
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={consentDataProcessing}
            onChange={e => setConsentDataProcessing(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span>Toestemming gegeven voor verwerking persoonsgegevens (AVG).</span>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-50">
          <Link
            href="/dashboard/spelers"
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            Annuleren
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Speler opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
