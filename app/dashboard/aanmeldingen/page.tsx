import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

const statusLabels: Record<string, string> = {
  nieuw: 'Nieuw', wacht_op_ouder: 'Wacht op ouder',
  goedgekeurd: 'Goedgekeurd', afgewezen: 'Afgewezen',
}
const statusColors: Record<string, string> = {
  nieuw: 'bg-blue-50 text-blue-700',
  wacht_op_ouder: 'bg-amber-50 text-amber-700',
  goedgekeurd: 'bg-green-50 text-green-700',
  afgewezen: 'bg-red-50 text-red-700',
}
const roleLabels: Record<string, string> = {
  coach: 'Coach', speler: 'Speler', teammanager: 'Teammanager', tc: 'TC',
}

export default async function AanmeldingenPage() {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('UserRequest')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Aanmeldingen</h1>
          <p className="text-sm text-gray-500 mt-0.5">{requests?.length ?? 0} aanmeldingen</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Naam</th>
              <th className="text-left px-5 py-3 font-medium">E-mail</th>
              <th className="text-left px-5 py-3 font-medium">Gewenste rol</th>
              <th className="text-left px-5 py-3 font-medium">Team voorkeur</th>
              <th className="text-left px-5 py-3 font-medium">Ingediend</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests && requests.length > 0 ? requests.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm font-medium text-gray-900">
                  {r.first_name} {r.last_name}
                  {r.is_minor && <span className="ml-1.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Minderjarig</span>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{r.email}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{roleLabels[r.requested_role] ?? r.requested_role}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{r.team_preference || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(r.created_at)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  Geen aanmeldingen ontvangen
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
