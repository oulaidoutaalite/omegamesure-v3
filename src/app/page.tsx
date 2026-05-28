import Link from 'next/link'

export const metadata = { title: 'Omega Mesure' }

export default function HomePlaceholder() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 to-background p-6">
      <div className="max-w-2xl text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand text-2xl font-bold text-white">
          Ω
        </div>
        <h1 className="text-4xl font-bold text-brand">Omega Mesure</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Votre partenaire scientifique &amp; industriel
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-left text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Site en cours de construction.</strong> Le squelette
            d&apos;authentification et le dashboard admin sont prêts. Les pages publiques
            (<code>/[locale]</code>) seront ajoutées prochainement.
          </p>
        </div>

        <Link
          href="/admin"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Accéder à l&apos;admin →
        </Link>
      </div>
    </main>
  )
}
