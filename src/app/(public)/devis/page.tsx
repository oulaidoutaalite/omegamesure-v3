import {
  IconCheck,
  IconClock,
  IconShieldCheck,
} from '@tabler/icons-react'

import { Container } from '@/components/public/Container'
import { QuoteForm } from '@/components/public/QuoteForm'
import { loadAllConfig } from '@/lib/site-config'

export const metadata = { title: 'Demander un devis' }
export const dynamic = 'force-dynamic'

export default async function QuotePage({
  searchParams,
}: { searchParams: Promise<{ productSlug?: string; type?: string }> }) {
  const sp = await searchParams
  const config = await loadAllConfig()

  const formConfig = {
    showCompany:  (config['quoteForm.showCompany']  as boolean) ?? true,
    showPhone:    (config['quoteForm.showPhone']    as boolean) ?? true,
    showSector:   (config['quoteForm.showSector']   as boolean) ?? true,
    showQuantity: (config['quoteForm.showQuantity'] as boolean) ?? true,
    showDeadline: (config['quoteForm.showDeadline'] as boolean) ?? true,
    confirmationMessage: (config['quoteForm.confirmationMessage'] as string) ?? '',
  }

  return (
    <>
      <section className="border-b border-border bg-gradient-to-br from-brand-50 via-background to-background py-12">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Devis</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Décrivez-nous votre besoin
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Notre équipe vous répond sous 24 à 48 h ouvrées avec une proposition adaptée.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 lg:py-16">
        <Container size="narrow">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1">
              <Promise icon={IconClock} title="Réponse rapide"
                       text="Sous 24 à 48 h ouvrées." />
              <Promise icon={IconShieldCheck} title="Confidentialité"
                       text="Vos données restent strictement internes." />
              <Promise icon={IconCheck} title="Sans engagement"
                       text="Études techniques et chiffrage gratuits." />
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <QuoteForm
                  config={formConfig}
                  productSlug={sp.productSlug}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

function Promise({
  icon: Icon, title, text,
}: { icon: typeof IconCheck; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
