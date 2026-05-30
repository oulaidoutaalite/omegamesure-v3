import { ConfigForm, type FieldDef } from '@/components/admin/config/ConfigForm'
import { ConfigTabs } from '@/components/admin/config/ConfigTabs'
import { requireRole } from '@/lib/auth-helpers'
import { loadAllConfig } from '@/lib/site-config'

export const metadata = { title: 'Configuration du site' }
export const dynamic = 'force-dynamic'

// ─── Field definitions per section ──────────────────────────────────────────
const GENERAL: FieldDef[] = [
  { key: 'site.name',     label: 'Nom du site',            type: 'text',     placeholder: 'Omega Mesure' },
  { key: 'site.tagline',  label: 'Slogan',                 type: 'text',     placeholder: 'Votre partenaire scientifique & industriel' },
  { key: 'site.description', label: 'Description courte', type: 'textarea', rows: 2, helper: 'Pour les méta sociaux par défaut' },
  { key: 'certifications', label: 'Certifications',        type: 'tags',     helper: 'Affichées sur la home et le footer (séparées par virgule).', placeholder: 'ISO 17025, COFRAC' },
]

const BRANDING: FieldDef[] = [
  { key: 'branding.logo',    label: 'Logo (clair)',  type: 'image', folder: 'branding', helper: 'Logo principal — affiché sur fond clair.' },
  { key: 'branding.logoDark',label: 'Logo (sombre)', type: 'image', folder: 'branding', helper: 'Optionnel — affiché sur fond foncé (footer, etc.).' },
  { key: 'branding.favicon', label: 'Favicon',       type: 'image', folder: 'branding', helper: '32×32 idéalement, format PNG ou ICO.' },
  { key: 'branding.primary', label: 'Couleur primaire', type: 'color', helper: 'Bleu Omega par défaut.' },
  { key: 'branding.accent',  label: 'Couleur d’accent',  type: 'color' },
]

const CONTACT: FieldDef[] = [
  { key: 'contact.address', label: 'Adresse',     type: 'textarea', rows: 2, placeholder: 'N°35 Lotissement Doha, Bouskoura, Maroc' },
  { key: 'contact.phone',   label: 'Téléphone',   type: 'tel',      placeholder: '+212 664 323 049' },
  { key: 'contact.email',   label: 'Email',       type: 'email',    placeholder: 'contact@omegamesure.com' },
  { key: 'contact.hours',   label: 'Horaires',    type: 'text',     placeholder: 'Lundi – Vendredi · 08h00 – 18h00' },
  { key: 'contact.mapUrl',  label: 'Lien Google Maps (embed)', type: 'url', helper: 'Coller le « src » de l’iframe Google Maps.' },
]

const SOCIAL: FieldDef[] = [
  { key: 'social.linkedin',  label: 'LinkedIn',  type: 'url', placeholder: 'https://linkedin.com/company/...' },
  { key: 'social.facebook',  label: 'Facebook',  type: 'url' },
  { key: 'social.instagram', label: 'Instagram', type: 'url' },
  { key: 'social.youtube',   label: 'YouTube',   type: 'url' },
  { key: 'social.twitter',   label: 'X / Twitter', type: 'url' },
]

const SEO: FieldDef[] = [
  { key: 'seo.description', label: 'Meta description globale', type: 'textarea', rows: 3 },
  { key: 'seo.keywords',    label: 'Mots-clés',                type: 'tags' },
  { key: 'seo.ogImage',     label: 'Image de partage (OG)',    type: 'image', folder: 'seo', helper: '1200×630 recommandé.' },
]

const QUOTE_FORM: FieldDef[] = [
  { key: 'quoteForm.recipientEmail', label: 'Email destinataire des devis', type: 'email', helper: 'Override de EMAIL_QUOTE_RECIPIENT côté env.' },
  { key: 'quoteForm.showCompany',    label: 'Afficher le champ Société',         type: 'boolean' },
  { key: 'quoteForm.showPhone',      label: 'Afficher le champ Téléphone',       type: 'boolean' },
  { key: 'quoteForm.showSector',     label: 'Afficher le champ Secteur',         type: 'boolean' },
  { key: 'quoteForm.showQuantity',   label: 'Afficher le champ Quantité',        type: 'boolean' },
  { key: 'quoteForm.showDeadline',   label: 'Afficher le champ Délai souhaité',  type: 'boolean' },
  { key: 'quoteForm.confirmationMessage', label: 'Message de confirmation', type: 'textarea', rows: 3, helper: 'Affiché au client après envoi.' },
]

export default async function ConfigPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const config = await loadAllConfig()

  const tabs = [
    { value: 'general',  label: 'Général',          content: <ConfigForm category="general"  fields={GENERAL}    initialValues={config} /> },
    { value: 'branding', label: 'Identité visuelle', content: <ConfigForm category="branding" fields={BRANDING}   initialValues={config} /> },
    { value: 'contact',  label: 'Coordonnées',      content: <ConfigForm category="contact"  fields={CONTACT}    initialValues={config} /> },
    { value: 'social',   label: 'Réseaux sociaux',  content: <ConfigForm category="social"   fields={SOCIAL}     initialValues={config} /> },
    { value: 'seo',      label: 'SEO',              content: <ConfigForm category="seo"      fields={SEO}        initialValues={config} /> },
    { value: 'quoteForm',label: 'Formulaire devis', content: <ConfigForm category="quoteForm" fields={QUOTE_FORM} initialValues={config} /> },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Configuration du site</h1>
        <p className="text-sm text-muted-foreground">
          Tous les paramètres globaux. Chaque section dispose de son propre bouton « Enregistrer ».
        </p>
      </header>

      <ConfigTabs tabs={tabs} />
    </div>
  )
}
