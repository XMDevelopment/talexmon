import { createClient } from '@/lib/supabase/server'
import { formatDate, statusColors } from '@/lib/utils'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function TrainingenPage() {
  const supabase = await createClient()

  const { data: trainings } = await supabase
    .from('Training')
    .select('*, Team(name)')
    .order('date', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trainingen</h1>
          <p className="text-sm text-gray-500 mt-0.5">{trainings?.length ?? 0} trainingen</p>
        </div>
        <Link
          href="/dashboard/trainingen/nieuw"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Training toevoegen
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-50">
              <th className="text-left px-5 py-3 font-medium">Datum</th>
              <th className="text-left px-5 py-3 font-medium">Team</th>
              <th className="text-left px-5 py-3 font-medium">Thema</th>
              <th className="text-left px-5 py-3 font-medium">Duur</th>
              <th className="text-left px-5 py-3 font-medium">Locatie</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {trainings && trainings.length > 0 ? trainings.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">{formatDate(t.date)}</p>
                  {t.time && <p className="text-xs text-gray-400">{t.time}</p>}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{(t.Team as any)?.name}</td>
                <td className="px-5 py-3 text-sm text-gray-900">
                  <Link href={`/dashboard/trainingen/${t.id}`} className="hover:text-green-600">
                    {t.theme || 'Training'}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{t.duration_minutes} min</td>
                <td className="px-5 py-3 text-sm text-gray-600">{t.location || <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                  Nog geen trainingen toegevoegd
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
