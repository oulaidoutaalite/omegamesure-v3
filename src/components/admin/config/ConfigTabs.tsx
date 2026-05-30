'use client'

import * as Tabs from '@radix-ui/react-tabs'
import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type TabDef = { value: string; label: string; content: ReactNode }

export function ConfigTabs({ tabs, defaultValue }: { tabs: TabDef[]; defaultValue?: string }) {
  return (
    <Tabs.Root defaultValue={defaultValue ?? tabs[0]?.value} className="space-y-6">
      <Tabs.List
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
        aria-label="Sections de configuration"
      >
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              'data-[state=active]:bg-brand data-[state=active]:text-white',
              'data-[state=inactive]:text-muted-foreground hover:bg-accent',
            )}
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((t) => (
        <Tabs.Content key={t.value} value={t.value} className="rounded-xl border border-border bg-card p-6">
          {t.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
