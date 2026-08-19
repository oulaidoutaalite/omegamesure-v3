import { ImageResponse } from 'next/og'

/**
 * Bannière de partage 1200×630 générée à la volée.
 *
 * Le logo seul fait un mauvais aperçu sur LinkedIn ou WhatsApp : il est carré,
 * recadré, et ne dit rien de la page. Cette route rend une vraie carte aux
 * couleurs de la marque, avec le titre de la page.
 *
 * ⚠️ Runtime edge : PAS d'accès à la base. Tout arrive par la query string,
 * remplie côté serveur par `buildSocial` qui, lui, a accès à la config.
 */
export const runtime = 'edge'

const BRAND = '#185FA5'
/** Le rendu n'embarque pas de police arabe : un titre en arabe donnerait des carrés. */
const isLatin = (s: string) => !/[\u0600-\u06FF]/.test(s)

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const site = (q.get('b') || 'Omega Mesure').slice(0, 60)
  const rawTitle = (q.get('t') || '').slice(0, 110)
  const title = isLatin(rawTitle) ? rawTitle : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '80px 90px',
          background: `linear-gradient(135deg, ${BRAND} 0%, #0F3E6E 100%)`,
          color: '#fff', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', width: 96, height: 8, background: '#fff', opacity: 0.9, borderRadius: 4 }} />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 62, fontWeight: 700, letterSpacing: -1 }}>{site}</div>
        {title ? (
          <div style={{ display: 'flex', marginTop: 22, fontSize: 40, lineHeight: 1.25, opacity: 0.92 }}>{title}</div>
        ) : null}
        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 26, opacity: 0.75 }}>omegamesure.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { 'cache-control': 'public, max-age=86400, s-maxage=604800, immutable' },
    },
  )
}
