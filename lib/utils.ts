import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInYears } from 'date-fns'
import { nl } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'd MMM yyyy', { locale: nl })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'd MMM yyyy HH:mm', { locale: nl })
  } catch {
    return '—'
  }
}

export function getAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth))
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function fullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`
}

export const roleLabels: Record<string, string> = {
  admin: 'Beheerder',
  tc: 'Technische Commissie',
  hoofdcoach: 'Hoofdcoach',
  coach: 'Coach',
  teammanager: 'Teammanager',
  speler: 'Speler',
  ouder: 'Ouder',
}

export const positionLabels: Record<string, string> = {
  keeper: 'Keeper',
  verdediger: 'Verdediger',
  middenvelder: 'Middenvelder',
  aanvaller: 'Aanvaller',
}

export const statusColors: Record<string, string> = {
  actief: 'bg-green-100 text-green-800',
  geblesseerd: 'bg-amber-100 text-amber-800',
  gestopt: 'bg-gray-100 text-gray-600',
  gepland: 'bg-blue-100 text-blue-800',
  gespeeld: 'bg-green-100 text-green-800',
  afgelast: 'bg-red-100 text-red-800',
  afgerond: 'bg-green-100 text-green-800',
  geannuleerd: 'bg-red-100 text-red-800',
  hersteld: 'bg-green-100 text-green-800',
}
