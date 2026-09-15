'use client'

import { IconPhoto } from '@tabler/icons-react'
import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

/**
 * Photo produit qui se replie proprement si le fichier ne se charge pas.
 *
 * Sans ce garde-fou, le navigateur affiche son icone d'image cassee ET le texte
 * alternatif en clair, qui deborde de la carte : la page entiere a l'air en
 * panne. Ici l'echec donne le meme pictogramme neutre que les fiches sans photo.
 *
 * ⚠️ Composant CLIENT : `onError` n'existe pas cote serveur. C'est la seule
 * raison de sa presence — le rendu reste identique a `next/image`.
 */
export function ProductImage({
  className,
  taillePicto = 36,
  ...props
}: ImageProps & { taillePicto?: number }) {
  const [casse, setCasse] = useState(false)

  if (casse) {
    return (
      <div
        className="grid h-full w-full place-items-center text-muted-foreground"
        role="img"
        aria-label={typeof props.alt === 'string' ? props.alt : undefined}
      >
        <IconPhoto size={taillePicto} aria-hidden />
      </div>
    )
  }

  return <Image {...props} className={cn(className)} onError={() => setCasse(true)} />
}
