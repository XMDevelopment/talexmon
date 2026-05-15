import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function BeoordelingenPage() {
  const supabase = await createClient()

  const { data: assessments } = await supabase
    .from('Assessment')
    .select('*, Player(first_name, last_name), Team(name)')
    .order('date', { ascending: false })

  function avg(...vals: (number | null | undefined)[]) {
    const valid = vals.filter(v => v != null) as number[]
    if (!valid.length) return null
    return (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Beoordelingen</h1>
          <p className="text-sm text-gray-500 mt-0.5">{assessments?.length ?? 0} beoordelingen</p>
        </div>
        <Link
          href="/dashboard/beoordelingen/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Beoordeling toevoegen
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Speler</th>
              <th className="text-left px-5 py-3 font-medium">Team</th>
              <th className="text-left px-5 py-3 font-medium">Datum</th>
              <th className="text-left px-5 py-3 font-medium">Techniek</th>
              <th className="text-left px-5 py-3 font-medium">Tactiek</th>
              <th className="text-left px-5 py-3 font-medium">Fysiek</th>
              <th className="text-left px-5 py-3 font-medium">Mentaal</th>
              <th className="text-left px-5 py-3 font-medium">Gedeeld</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {assessments && assessments.length > 0 ? assessments.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  <Link href={`/dashboard/beoordelingen/${a.id}`} className="hover:text-green-600">
                    {(a.Player as any)?.first_name} {(a.Player as any)?.last_name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{(a.Team as any)?.name}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(a.date)}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {avg(a.tech_ball_control, a.tech_passing, a.tech_dribbling) ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {avg(a.tact_game_insight, a.tact_positioning, a.tact_transition) ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {avg(a.phys_speed, a.phys_endurance, a.phys_strength) ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {avg(a.ment_effort, a.ment_coachability, a.ment_teamwork) ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${a.shared_with_player ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                    {a.shared_with_player ? 'Ja' : 'Nee'}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nog geen beoordelingen ingevoerd
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
