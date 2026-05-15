import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Users, Calendar, Dumbbell, Bandage, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: appUser } = await supabase.from('User').select('*').eq('id', user!.id).single()

  // Fetch dashboard stats in parallel
  const [
    { count: playerCount },
    { count: matchCount },
    { count: trainingCount },
    { count: injuryCount },
    { data: upcomingMatches },
    { data: recentTrainings },
  ] = await Promise.all([
    supabase.from('Player').select('*', { count: 'exact', head: true }).eq('status', 'actief'),
    supabase.from('Match').select('*', { count: 'exact', head: true }).eq('status', 'gepland'),
    supabase.from('Training').select('*', { count: 'exact', head: true }).eq('status', 'gepland'),
    supabase.from('Injury').select('*', { count: 'exact', head: true }).eq('status', 'actief'),
    supabase.from('Match').select('*, Team(name)').eq('status', 'gepland').order('date').limit(5),
    supabase.from('Training').select('*, Team(name)').eq('status', 'gepland').order('date').limit(5),
  ])

  const stats = [
    { label: 'Actieve spelers', value: playerCount ?? 0, icon: Users, color: 'text-blue-600 bg-blue-50', href: '/dashboard/spelers' },
    { label: 'Geplande wedstrijden', value: matchCount ?? 0, icon: Calendar, color: 'text-green-600 bg-green-50', href: '/dashboard/wedstrijden' },
    { label: 'Geplande trainingen', value: trainingCount ?? 0, icon: Dumbbell, color: 'text-purple-600 bg-purple-50', href: '/dashboard/trainingen' },
    { label: 'Actieve blessures', value: injuryCount ?? 0, icon: Bandage, color: 'text-amber-600 bg-amber-50', href: '/dashboard/blessures' },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Overzicht</h1>
        <p className="text-gray-500 text-sm mt-1">Welkom terug — hier is de stand van zaken</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-colors cursor-pointer">
              <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon size={18} />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming matches */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-900 text-sm">Aankomende wedstrijden</h2>
            <Link href="/dashboard/wedstrijden" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
              Alle <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingMatches && upcomingMatches.length > 0 ? upcomingMatches.map((match: any) => (
              <div key={match.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">vs {match.opponent}</p>
                  <p className="text-xs text-gray-400">{(match.Team as any)?.name} · {match.home_away === 'thuis' ? 'Thuis' : 'Uit'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">{formatDate(match.date)}</p>
                  {match.time && <p className="text-xs text-gray-400">{match.time}</p>}
                </div>
              </div>
            )) : (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Geen geplande wedstrijden</p>
            )}
          </div>
        </div>

        {/* Upcoming trainings */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-medium text-gray-900 text-sm">Aankomende trainingen</h2>
            <Link href="/dashboard/trainingen" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
              Alle <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTrainings && recentTrainings.length > 0 ? recentTrainings.map((training: any) => (
              <div key={training.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{training.theme || 'Training'}</p>
                  <p className="text-xs text-gray-400">{(training.Team as any)?.name} · {training.duration_minutes} min</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-700">{formatDate(training.date)}</p>
                  {training.time && <p className="text-xs text-gray-400">{training.time}</p>}
                </div>
              </div>
            )) : (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Geen geplande trainingen</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
