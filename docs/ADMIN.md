# Guide admin — Omega Mesure

Ce guide explique comment piloter le contenu du site depuis le dashboard
`/admin`. Aucun accès au code n'est nécessaire pour les opérations courantes.

## Connexion

1. Allez sur `https://votre-domaine.com/admin/login`
2. Connectez-vous avec votre email + mot de passe
3. Vous êtes redirigé vers le tableau de bord `/admin`

Trois rôles :

| Rôle | Permissions |
|---|---|
| **EDITOR** | Produits, médias, devis, messages, blog (futur) |
| **ADMIN** | Tout l'éditeur + navigation, catégories, configuration, langues |
| **SUPER_ADMIN** | Tous les droits + gestion des utilisateurs |

## Navigation (`/admin/navigation`)

Liste des items du menu principal. Pour chaque item :

- **Réordonner** : glissez la poignée à gauche
- **Publier/masquer** : toggle à droite
- **Éditer** : crayon → libellé, slug (URL), icône Tabler, parent, flag CTA
- **Bouton CTA** : marquez « Demander un devis » pour qu'il apparaisse comme
  bouton bleu plutôt que lien standard
- **Sous-menu** : sélectionnez un parent pour créer une entrée sous-menu
  (un seul niveau de profondeur supporté)
- **Traductions** : section repliable en bas du formulaire — onglets par langue
  active autre que le français

> Astuce : pour cacher temporairement un item du site sans le supprimer,
> utilisez le toggle de publication.

## Catégories (`/admin/categories`)

5 catégories au seed initial (Équipements labo, Balances, Consommables,
Métrologie, Consulting). Chaque catégorie possède :

- **Nom**, **slug** (URL), description courte
- **Couleur** (color picker) — utilisée pour le badge sur la home et les cartes
- **Icône Tabler** — affichée sur la carte de navigation home
- **Image hero** (URL) — optionnelle
- **Item de navigation lié** — relie la catégorie à un slot du menu
- **SEO** (meta title + description) — repliable
- **Sous-catégories** : section en bas de l'éditeur, CRUD inline avec
  drag&drop et flag « Autres »
- **Traductions** : section repliable

> Le flag « Autres » sur une sous-catégorie signale qu'il s'agit du slot
> générique. Il est encore éditable comme les autres (libellé, description).

## Produits (`/admin/products`)

Catalogue complet. La page principale offre :

- Recherche full-text (nom, marque, modèle, slug)
- Filtre par catégorie
- Onglets statut (Tous / Publiés / Brouillons)
- Toggle publication inline (la table ne se rafraîchit pas — `revalidatePath`
  s'en charge à la prochaine navigation)
- Étoile ★ pour marquer un produit comme « Mis en avant » (affiché en premier
  sur la home et en haut des listes catégorie)

L'éditeur de produit comporte :

- Nom + slug + brand + model + prix + devise
- Description courte (≤ 300 car) + description longue
- **Images** : ouvre une modale MediaPicker (upload inline + sélection
  multi-fichiers + désignation de l'image principale ★)
- **Fiche technique** : un PDF via le même MediaPicker (mode `accept=DOCUMENT`)
- **Classification** : sélecteur catégorie → sous-catégorie en cascade
- **SEO** : repliable
- **Traductions** : repliable

## Médias (`/admin/media`)

Bibliothèque centralisée :

- Drop-zone pour upload multi-fichiers (images jpg/png/webp/svg, PDF, Word, Excel)
- Filtres par type (Images / Documents) et par dossier
- Clic sur un fichier → modal d'édition (alt, dossier, tags, supprimer)
- Réutilisable via le `MediaPicker` dans les formulaires produits et config

Taille max par fichier configurable via `MAX_UPLOAD_SIZE_MB` (défaut 8 MB).
Stockage local sous `public/uploads/<dossier>/<hash>.ext`.

## Devis (`/admin/quotes`)

Workflow business :

```
NEW → IN_PROGRESS → QUOTE_SENT → WON | LOST
```

Le visiteur soumet un devis depuis `/devis` ou `/devis?productSlug=…`. Il
reçoit immédiatement un email de confirmation. L'admin reçoit un email de
notification avec lien direct vers la fiche détail.

Sur la fiche détail :

- **Workflow** : changer le statut, assigner à un utilisateur, ajouter des
  notes internes (non envoyées au client)
- **Répondre** : éditeur de message + cocher « Marquer comme envoyé » pour
  passer en `QUOTE_SENT` automatiquement
- **Email envoyé** : reste tracé (`emailSentAt`, `emailReplyText`)

Export CSV de tous les devis via le bouton « Export CSV » (UTF-8 BOM, ouvre
proprement dans Excel).

## Messages contact (`/admin/messages`)

Workflow simplifié :

```
NEW → READ (auto à l'ouverture) → REPLIED → ARCHIVED
```

Liste avec onglets par statut. La fiche détail permet d'archiver, supprimer,
ou répondre par email (la réponse est tracée comme pour les devis).

## Configuration (`/admin/config`)

6 onglets :

| Onglet | Clés modifiables |
|---|---|
| Général | Nom du site, slogan, description courte, certifications affichées |
| Identité visuelle | Logo (clair + sombre), favicon, couleur primaire, couleur d'accent |
| Coordonnées | Adresse, téléphone, email, horaires, URL Google Maps embed |
| Réseaux sociaux | LinkedIn, Facebook, Instagram, YouTube, X |
| SEO | Meta description globale, mots-clés, image OG |
| Formulaire devis | Champs activables (société, téléphone, secteur, quantité, délai), message de confirmation, email destinataire |

Chaque onglet possède son propre bouton « Enregistrer cette section ».
Les changements sont visibles immédiatement sur le site public (cache invalidé).

## Langues (`/admin/languages`)

- Toggle ON/OFF par langue (la langue par défaut ne peut pas être désactivée
  tant qu'elle est par défaut)
- Bouton étoile pour définir la langue par défaut (action `SUPER_ADMIN`,
  langue doit être active au préalable)
- Une fois une langue activée, l'éditeur de traductions apparaît dans les
  formulaires Navigation, Catégories, Sous-catégories et Produits

## Utilisateurs (`/admin/users`)

Réservé `SUPER_ADMIN`. CRUD complet :

- **Création** : email, nom, mot de passe (≥ 8 car.), rôle, actif
- **Édition** : tous les champs sauf le mot de passe
- **Réinitialisation mot de passe** : bouton clé sur la ligne → prompt
- **Toggle actif** : Switch sur la ligne (auto-désactivation interdite)
- **Suppression** : poubelle (auto-suppression interdite, dernier super-admin
  actif protégé)

## Journal d'activité

Toutes les opérations admin sont tracées en base via la table `ActivityLog`
(action, entityType, entityId, userId, IP, user-agent, metadata).

La page de visualisation n'est pas encore exposée dans le dashboard
— pour l'instant, requêtez la table directement via `npm run db:studio`
ou ajoutez un module `/admin/activity` (cf. roadmap).

## Bonnes pratiques

- ☑ Créez un compte `ADMIN` par utilisateur réel (ne partagez pas le compte
  super-admin de production)
- ☑ Changez le mot de passe par défaut (`ChangeMe2026!`) au premier login
- ☑ Définissez des images claires (1200×630) pour l'OG image et les heros
- ☑ Remplissez les meta SEO sur les catégories et produits principaux
- ☑ Mettez à jour `EMAIL_QUOTE_RECIPIENT` quand vous changez d'équipe commerciale
- ⚠ Avant `npm run db:reset` en prod, exportez `db:studio` ou un dump complet
