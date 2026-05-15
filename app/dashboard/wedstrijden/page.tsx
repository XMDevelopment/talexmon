import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColors } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function WedstrijdenPage() {
  const supabase = await createClient()

  const { data: matches } = await supabase
    .from('Match')
    .select('*, Team(name)')
    .order('date', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Wedstrijden</h1>
          <p className="text-sm text-gray-500 mt-0.5">{matches?.length ?? 0} wedstrijden</p>
        </div>
        <Link
          href="/dashboard/wedstrijden/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Wedstrijd toevoegen
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Datum</th>
              <th className="text-left px-5 py-3 font-medium">Team</th>
              <th className="text-left px-5 py-3 font-medium">Tegenstander</th>
              <th className="text-left px-5 py-3 font-medium">T/U</th>
              <th className="text-left px-5 py-3 font-medium">Uitslag</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {matches && matches.length > 0 ? matches.map((match: any) => (
              <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{formatDate(match.date)}</p>
                  {match.time && <p className="text-xs text-gray-400">{match.time}</p>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{(match.Team as any)?.name}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  <Link href={`/dashboard/wedstrijden/${match.id}`} className="hover:text-green-600">
                    {match.opponent}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${match.home_away === 'thuis' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}>
                    {match.home_away === 'thuis' ? 'Thuis' : 'Uit'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {match.goals_for !== null && match.goals_against !== null
                    ? `${match.goals_for} – ${match.goals_against}`
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[match.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nog geen wedstrijden toegevoegd
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
