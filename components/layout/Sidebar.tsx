'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn, roleLabels, getInitials } from '@/lib/utils'
import type { AppUser } from '@/lib/types'
import {
  LayoutDashboard, Users, Shield, Calendar, Dumbbell,
  ClipboardCheck, Bandage, UserPlus, Settings, LogOut,
  ChevronRight, Bell
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Overzicht', icon: LayoutDashboard, roles: ['admin','tc','hoofdcoach','coach','teammanager','speler','ouder'] },
  { href: '/dashboard/spelers', label: 'Spelers', icon: Users, roles: ['admin','tc','hoofdcoach','coach','teammanager'] },
  { href: '/dashboard/teams', label: 'Teams', icon: Shield, roles: ['admin','tc','hoofdcoach','coach','teammanager'] },
  { href: '/dashboard/wedstrijden', label: 'Wedstrijden', icon: Calendar, roles: ['admin','tc','hoofdcoach','coach','teammanager','speler','ouder'] },
  { href: '/dashboard/trainingen', label: 'Trainingen', icon: Dumbbell, roles: ['admin','tc','hoofdcoach','coach','teammanager','speler','ouder'] },
  { href: '/dashboard/beoordelingen', label: 'Beoordelingen', icon: ClipboardCheck, roles: ['admin','tc','hoofdcoach','coach'] },
  { href: '/dashboard/blessures', label: 'Blessures', icon: Bandage, roles: ['admin','tc','hoofdcoach','coach'] },
  { href: '/dashboard/aanmeldingen', label: 'Aanmeldingen', icon: UserPlus, roles: ['admin','tc'] },
  { href: '/dashboard/instellingen', label: 'Instellingen', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  user: AppUser | null
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const userRole = user?.role || 'speler'
  const visibleNav = navItems.filter(item => item.roles.includes(userRole))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">TX</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-none">TaleXMon</p>
            <p className="text-xs text-gray-400 mt-0.5">Clubbeheer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {visibleNav.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon size={17} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                  {item.label}
                  {isActive && <ChevronRight size={14} className="ml-auto text-green-400" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-semibold text-xs">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'TX'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user?.email || 'Gebruiker'}</p>
            <p className="text-xs text-gray-400">{roleLabels[userRole] || userRole}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
