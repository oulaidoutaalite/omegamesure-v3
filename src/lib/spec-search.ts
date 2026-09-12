// Fait le pont entre ce qui s'AFFICHE et ce qui est INDEXÉ dans les tableaux de specs.
//
// Le problème : les libellés et valeurs de specs sont stockés dans UNE seule langue
// (celle du catalogue fournisseur) et traduits à l'affichage par `spec-labels.ts`.
// Un visiteur francophone lit donc « Alimentation » sur une fiche d'origine anglaise,
// mais la base contient « Power Supply » : taper « Alimentation » dans la recherche
// ne remontait pas cette fiche.
//
// La réponse : élargir la requête. Si le mot cherché correspond à une traduction
// connue, on cherche AUSSI les formes des autres langues. La recherche ne porte
// toujours que sur le texte réellement stocké — rien n'est réécrit en base.
//
// ⚠️ Portée volontairement limitée aux requêtes courtes (un mot, une locution) :
// les libellés longs et ponctués (« Shipping Size(W×D×H)(mm) ») s'écrivent de dix
// façons dans les catalogues, et la forme canonique du glossaire ne les retrouve pas
// toutes par simple sous-chaîne. Personne ne cherche ces libellés-là.
import libelles from '@/data/spec-labels.json'
import valeurs from '@/data/spec-values.json'

type Entree = { fr?: string; en?: string; ar?: string }

/** minuscules + accents retirés, pour comparer comme le fait `unaccent` côté Postgres */
function plat(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ⚠️ Index precalcule UNE fois, pas a chaque requete. Mesure sur les 5 286 entrees
// des deux glossaires : recalculer `plat()` a chaque appel coutait 38 ms par
// recherche. Ici le cout est paye une seule fois au chargement du module.
type Ligne = {
  /** les trois langues, aplaties — sert a RECONNAITRE la requete */
  cherchables: string[]
  /** français et anglais seulement, forme d'origine — sert a ELARGIR la requete */
  emettables: { texte: string; plat: string }[]
}

const index: Ligne[] = (() => {
  const out: Ligne[] = []
  for (const table of [libelles as Record<string, Entree>, valeurs as Record<string, Entree>]) {
    for (const e of Object.values(table)) {
      const cherchables = [e.fr, e.en, e.ar]
        .filter((v): v is string => Boolean(v && v.trim()))
        .map(plat)
      if (!cherchables.length) continue
      // On CHERCHE dans les trois langues — un visiteur arabophone tape en arabe —
      // mais on n'EMET que du français et de l'anglais : verifie, aucune des 2 137
      // fiches a specs ne contient d'arabe en base, une forme arabe ne matcherait
      // jamais et consommerait une place dans le plafond.
      const emettables = [e.fr, e.en]
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => ({ texte: v, plat: plat(v) }))
      out.push({ cherchables, emettables })
    }
  }
  return out
})()

/**
 * Rend les formes des AUTRES langues à chercher en plus de la requête.
 * Vide si la requête ne correspond à aucune entrée des glossaires — cas de loin
 * le plus fréquent, la recherche reste alors exactement ce qu'elle était.
 */
export function expandSpecQuery(q: string, max = 8): string[] {
  const cible = plat(q)
  // en dessous de 3 caractères on matcherait la moitié du glossaire pour rien
  if (cible.length < 3) return []

  // ⚠️ Classer AVANT de plafonner : « Alimentation » apparaît aussi dans
  // « Raccord d'alimentation en air », et sans tri le plafond tombait sur ces
  // correspondances lâches sans jamais atteindre « Power supply ».
  const candidats = new Map<string, number>()
  for (const ligne of index) {
    let rang = 9
    for (const p of ligne.cherchables) {
      if (p === cible) { rang = 0; break }
      if (p.startsWith(cible)) rang = Math.min(rang, 1)
      else if (p.includes(cible)) rang = Math.min(rang, 2)
    }
    if (rang === 9) continue
    for (const f of ligne.emettables) {
      // inutile d'ajouter une forme que la requête d'origine trouve déjà
      if (f.plat.includes(cible)) continue
      const score = rang * 1000 + f.texte.length
      const vu = candidats.get(f.texte)
      if (vu === undefined || score < vu) candidats.set(f.texte, score)
    }
  }
  return [...candidats.entries()].sort((a, b) => a[1] - b[1]).slice(0, max).map(([v]) => v)
}

export const specSearchIndexSize = index.length
