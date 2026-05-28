'use client'

import {
  IconBriefcase,
  IconFileInvoice,
  IconHome,
  IconLayoutDashboard,
  IconMail,
  IconPackage,
  IconPhoto,
  IconSettings,
  IconUsers,
  IconWorld,
  IconNews,
  IconList,
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

type NavGroup = {
  title: string
  items: Array<{
    label: string
    href: string
    icon: typeof IconHome
    soon?: boolean
    superOnly?: boolean
  }>
}

const groups: NavGroup[] = [
  {
    title: 'Aperçu',
    items: [{ label: 'Tableau de bord', href: '/admin', icon: IconLayoutDashboard }],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Produits',         href: '/admin/products',       icon: IconPackage,    soon: true },
      { label: 'Catégories',       href: '/admin/categories',     icon: IconList },
      { label: 'Médias',           href: '/admin/media',          icon: IconPhoto,      soon: true },
    ],
  },
  {
    title: 'Site public',
    items: [
      { label: 'Navigation',       href: '/admin/navigation',     icon: IconList },
      { label: 'Page d\'accueil',  href: '/admin/homepage',       icon: IconHome,       soon: true },
      { label: 'Configuration',    href: '/admin/settings',       icon: IconSettings,   soon: true },
      { label: 'Langues',          href: '/admin/languages',      icon: IconWorld,      soon: true },
    ],
  },
  {
    title: 'CRM',
    items: [
      { label: 'Devis',            href: '/admin/quotes',         icon: IconFileInvoice, soon: true },
      { label: 'Messages contact', href: '/admin/messages',       icon: IconMail,        soon: true },
    ],
  },
  {
    title: 'Blog',
    items: [
      { label: 'Articles',         href: '/admin/blog',           icon: IconNews,        soon: true },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Utilisateurs',     href: '/admin/users',          icon: IconUsers,       soon: true, superOnly: true },
      { label: 'Journal d\'activité', href: '/admin/activity',    icon: IconBriefcase,   soon: true },
    ],
  },
]

export function AdminSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="h-7 w-7 rounded-md bg-brand text-center text-sm font-bold leading-7 text-white">
          Ω
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Omega Mesure</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </div>
            <ul className="space-y-0.5">
              {group.items
                .filter((item) => !item.superOnly || userRole === 'SUPER_ADMIN')
                .map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.soon ? '#' : item.href}
                        aria-disabled={item.soon}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-brand/10 font-medium text-brand'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          item.soon && 'cursor-not-allowed opacity-50 hover:bg-transparent',
                        )}
                      >
                        <Icon size={18} stroke={1.75} />
                        <span className="flex-1">{item.label}</span>
                        {item.soon && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
                            soon
                          </span>
                        )}
                      </Link>
                    </li>
                  )
                })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3 text-[10px] text-muted-foreground">
        Omega Mesure v3 · build dev
      </div>
    </aside>
  )
}
