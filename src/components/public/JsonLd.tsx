/**
 * Injecte des données structurées Schema.org.
 * Le `<` est échappé : un nom de produit contenant du HTML ne doit pas pouvoir
 * fermer la balise <script> et injecter du code.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }}
    />
  )
}
