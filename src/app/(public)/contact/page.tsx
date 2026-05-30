import {
  IconClock,
  IconMail,
  IconMapPin,
  IconPhone,
} from '@tabler/icons-react'

import { ContactForm } from '@/components/public/ContactForm'
import { Container } from '@/components/public/Container'
import { getContactConfig, loadAllConfig } from '@/lib/site-config'

export const metadata = { title: 'Contact' }
export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const [contact, config] = await Promise.all([getContactConfig(), loadAllConfig()])
  const mapUrl = (config['contact.mapUrl'] as string) ?? ''

  return (
    <>
      <section className="border-b border-border py-12">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">Contact</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Une question ? Parlons-en.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Nous restons à votre disposition pour tout renseignement technique ou commercial.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 lg:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-3">
            <aside className="space-y-4 lg:col-span-1">
              {contact.address && (
                <ContactRow icon={IconMapPin} label="Adresse" value={contact.address} multiline />
              )}
              {contact.phone && (
                <ContactRow
                  icon={IconPhone} label="Téléphone"
                  value={contact.phone}
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                />
              )}
              {contact.email && (
                <ContactRow
                  icon={IconMail} label="Email"
                  value={contact.email}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.hours && (
                <ContactRow icon={IconClock} label="Horaires" value={contact.hours} />
              )}
            </aside>

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
                <h2 className="mb-5 text-lg font-semibold">Envoyez-nous un message</h2>
                <ContactForm />
              </div>
            </div>
          </div>

          {mapUrl && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-border">
              <iframe
                src={mapUrl}
                title="Localisation"
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
        </Container>
      </section>
    </>
  )
}

function ContactRow({
  icon: Icon, label, value, href, multiline,
}: {
  icon: typeof IconMapPin
  label: string
  value: string
  href?: string
  multiline?: boolean
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={multiline ? 'whitespace-pre-line text-sm' : 'text-sm'}>{value}</p>
      </div>
    </>
  )
  if (href) {
    return (
      <a href={href} className="flex gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-brand/40">
        {content}
      </a>
    )
  }
  return <div className="flex gap-3 rounded-xl border border-border bg-card p-4">{content}</div>
}
