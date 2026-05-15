import { createClient } from '@/lib/supabase/server'
import { formatDate, getAge, positionLabels, statusColors } from '@/lib/utils'
import { UserPlus, Search } from 'lucide-react'
import Link from 'next/link'

export default async function SpelersPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('Player')
    .select('*, Team(name)')
    .order('last_name')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Spelers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{players?.length ?? 0} spelers gevonden</p>
        </div>
        <Link
          href="/dashboard/spelers/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <UserPlus size={15} />
          Speler toevoegen
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op naam..."
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Naam</th>
              <th className="text-left px-5 py-3 font-medium">Team</th>
              <th className="text-left px-5 py-3 font-medium">Positie</th>
              <th className="text-left px-5 py-3 font-medium">Leeftijd</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {players && players.length > 0 ? players.map((player: any) => (
              <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/dashboard/spelers/${player.id}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-semibold text-xs">
                        {player.first_name.charAt(0)}{player.last_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 hover:text-green-600">
                        {player.first_name} {player.last_name}
                      </p>
                      {player.player_email && (
                        <p className="text-xs text-gray-400">{player.player_email}</p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {(player.Team as any)?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {positionLabels[player.position] ?? player.position}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {getAge(player.date_of_birth)} jaar
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[player.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nog geen spelers toegevoegd
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
