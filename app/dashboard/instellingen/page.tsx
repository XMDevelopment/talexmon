import Link from 'next/link'
import { Users, ShieldCheck, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function InstellingenPage() {
  const supabase = await createClient()
  const { data: settings } = await supabase.from('AppSettings').select('*').single()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Instellingen</h1>
        <p className="text-sm text-gray-500 mt-0.5">Clubgegevens en systeeminstellingen</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          href="/dashboard/instellingen/gebruikers"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Gebruikers</p>
            <p className="text-xs text-gray-500 mt-0.5">Rollen en teamtoewijzingen</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
        <Link
          href="/dashboard/instellingen/coaches"
          className="bg-white rounded-xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Coaches</p>
            <p className="text-xs text-gray-500 mt-0.5">VOG-status en kwalificaties</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-4">Verenigingsgegevens</h2>
          <div className="space-y-4">
            {[
              { label: 'Verenigingsnaam', key: 'association_name', placeholder: 'bijv. VV Alkmaar' },
              { label: 'KvK-nummer', key: 'association_kvk', placeholder: '12345678' },
              { label: 'Adres', key: 'association_address', placeholder: 'Straat 1, 1234 AB Stad' },
              { label: 'Contact e-mail privacy/FG', key: 'contact_email_dpo', placeholder: 'privacy@club.nl' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  defaultValue={(settings as any)?.[field.key] ?? ''}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Opslaan
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-900 mb-1">Privacy & AVG</h2>
          <p className="text-xs text-gray-400 mb-4">Versie toestemmingsteksten en privacyverklaring</p>
          <div className="space-y-4">
            {[
              { label: 'Versie privacyverklaring', key: 'privacy_statement_version', placeholder: 'v1.0' },
              { label: 'Versie toestemmingstekst', key: 'consent_text_version', placeholder: 'v1.0' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  defaultValue={(settings as any)?.[field.key] ?? ''}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
