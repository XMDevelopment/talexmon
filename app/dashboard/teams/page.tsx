import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from('Team')
    .select('*, Season(name), AgeCategory(label)')
    .order('name')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-0.5">{teams?.length ?? 0} teams</p>
        </div>
        <Link
          href="/dashboard/teams/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Team toevoegen
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams && teams.length > 0 ? teams.map((team: any) => (
          <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
            <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{team.name.substring(0, 2).toUpperCase()}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${team.level === 'selectie' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                  {team.level === 'selectie' ? 'Selectie' : 'Recreatief'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{team.name}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {(team.AgeCategory as any)?.label ?? team.age_category ?? '—'} · {(team.Season as any)?.name ?? '—'}
              </p>
              {team.last_sync_status !== 'never' && (
                <div className={`mt-3 flex items-center gap-1.5 text-xs ${team.last_sync_status === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${team.last_sync_status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                  KNVB sync {team.last_sync_status === 'ok' ? 'actief' : 'fout'}
                </div>
              )}
            </div>
          </Link>
        )) : (
          <div className="col-span-3 bg-white rounded-xl border border-gray-100 py-12 text-center">
            <p className="text-sm text-gray-400">Nog geen teams aangemaakt</p>
            <Link href="/dashboard/teams/nieuw" className="text-sm text-green-600 hover:text-green-700 mt-2 inline-block">
              Eerste team toevoegen →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
