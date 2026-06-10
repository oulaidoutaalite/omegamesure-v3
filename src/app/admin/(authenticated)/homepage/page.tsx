import { ConfigForm, type FieldDef } from '@/components/admin/config/ConfigForm'
import { requireRole } from '@/lib/auth-helpers'
import { loadAllConfig } from '@/lib/site-config'

export const metadata = { title: "Page d'accueil" }
export const dynamic = 'force-dynamic'

// All home-page editorial texts, editable in the 3 site languages (FR/AR/EN).
const HOME_CONTENT: FieldDef[] = [
  // — Hero (haut de page) —
  { key: 'home.heroBadge',   label: 'Hero — badge',       type: 'multilang',          placeholder: 'Maroc · Distributeur agréé multi-marques' },
  { key: 'site.tagline',     label: 'Hero — slogan',      type: 'multilang',          placeholder: 'Votre partenaire scientifique & industriel' },
  { key: 'site.description', label: 'Hero — description', type: 'multilang-textarea', rows: 2, helper: 'Paragraphe sous le slogan. Laisser vide dans les 3 langues pour ne rien afficher.' },
  // — Chiffres-clés (bandeau) —
  { key: 'home.statProducts',        label: 'Chiffre 1 — libellé', type: 'multilang' },
  { key: 'home.statExperience',      label: 'Chiffre 2 — libellé', type: 'multilang' },
  { key: 'home.statExperienceValue', label: 'Chiffre 2 — valeur',  type: 'multilang', placeholder: '15+' },
  { key: 'home.statMetrology',       label: 'Chiffre 3 — libellé', type: 'multilang' },
  { key: 'home.statMetrologyValue',  label: 'Chiffre 3 — valeur',  type: 'multilang', placeholder: 'Toutes marques' },
  // — Section « Catalogue & services » —
  { key: 'home.statsTitle',   label: 'Section — sur-titre', type: 'multilang' },
  { key: 'home.statsHeading', label: 'Section — titre',     type: 'multilang' },
  { key: 'home.statsLead',    label: 'Section — texte',     type: 'multilang-textarea', rows: 2 },
  { key: 'home.certsTitle',   label: 'Bandeau certifications — titre', type: 'multilang' },
  // — Appel à l’action (bas de page) —
  { key: 'home.ctaTitle', label: 'Appel à l’action — titre', type: 'multilang' },
  { key: 'home.ctaLead',  label: 'Appel à l’action — texte', type: 'multilang-textarea', rows: 2 },
]

export default async function HomepageAdminPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const config = await loadAllConfig()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Page d&apos;accueil</h1>
        <p className="text-sm text-muted-foreground">
          Tous les textes de la page d&apos;accueil, éditables en français, arabe et anglais.
          Modifiez puis cliquez « Enregistrer ».
        </p>
      </header>

      <ConfigForm category="content" fields={HOME_CONTENT} initialValues={config} />
    </div>
  )
}
