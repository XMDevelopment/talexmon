import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColors } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'

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

export default async function BlessuresPage() {
  const supabase = await createClient()

  const { data: injuries } = await supabase
    .from('Injury')
    .select('*, Player(first_name, last_name), Team(name)')
    .order('start_date', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Blessures</h1>
          <p className="text-sm text-gray-500 mt-0.5">{injuries?.length ?? 0} blessures geregistreerd</p>
        </div>
        <Link
          href="/dashboard/blessures/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Blessure registreren
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Speler</th>
              <th className="text-left px-5 py-3 font-medium">Team</th>
              <th className="text-left px-5 py-3 font-medium">Type</th>
              <th className="text-left px-5 py-3 font-medium">Ernst</th>
              <th className="text-left px-5 py-3 font-medium">Datum</th>
              <th className="text-left px-5 py-3 font-medium">Verwacht terug</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {injuries && injuries.length > 0 ? injuries.map((injury: any) => (
              <tr key={injury.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {(injury.Player as any)?.first_name} {(injury.Player as any)?.last_name}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{(injury.Team as any)?.name}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{injuryLabels[injury.injury_type] ?? injury.injury_type}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${severityColors[injury.severity]}`}>
                    {injury.severity.charAt(0).toUpperCase() + injury.severity.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(injury.start_date)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {injury.expected_return ? formatDate(injury.expected_return) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[injury.status]}`}>
                    {injury.status === 'actief' ? 'Actief' : 'Hersteld'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                  Geen blessures geregistreerd
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
