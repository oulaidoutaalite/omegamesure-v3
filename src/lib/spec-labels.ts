// Glossaire des libelles du tableau de specifications.
//
// Le probleme : les libelles de lignes/colonnes sont stockes dans specs, chacun
// dans UNE seule langue — celle du catalogue fournisseur d'origine. Un libelle
// francais s'affichait donc tel quel sur /en/ et /ar/, et inversement.
//
// Le choix : traduire A L'AFFICHAGE, pas en base.
//   · les donnees restent la recopie exacte du catalogue (regle du projet) ;
//   · le francais reste la langue de reference ;
//   · c'est reversible, et un libelle absent du glossaire s'affiche tel quel
//     (comportement actuel) — aucune regression possible.
//
// La cle est normalisee : les catalogues ecrivent le meme libelle de dix facons
// ("Shipping Size (W×D×H)", "Shipping Size(W×D×H)(mm)"…). On harmonise la CASSE
// et la PONCTUATION, jamais le contenu : "Poids (kg)" et "Poids (g)" restent
// deux entrees distinctes.
import glossaire from '@/data/spec-labels.json'

type Entree = { fr?: string; en?: string; ar?: string }
const table = glossaire as Record<string, Entree>

export function normalizeSpecLabel(s: string): string {
  return String(s)
    .toLowerCase()
    .replace(/[\uff08]/g, '(')
    .replace(/[\uff09]/g, ')')
    .replace(/[\u00d7\u2715x*]/g, 'x')
    .replace(/[\u00a0\u2009\u202f]/g, ' ')
    .replace(/[\u2019\u02bc]/g, "'")
    .replace(/[\uff1a:]\s*$/, '')
    .replace(/\s*\(\s*/g, ' (')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Rend le libelle dans la langue demandee.
 * Renvoie le libelle d'origine si le glossaire ne le connait pas, ou si la
 * traduction manque pour cette langue : mieux vaut la langue source qu'un vide.
 */
export function translateSpecLabel(label: string, locale: string): string {
  const brut = String(label ?? '')
  if (!brut.trim()) return brut
  const e = table[normalizeSpecLabel(brut)]
  if (!e) return brut
  const lg = locale === 'ar' ? 'ar' : locale === 'en' ? 'en' : 'fr'
  const v = e[lg]
  return v && v.trim() ? v : brut
}

export const specGlossarySize = Object.keys(table).length
