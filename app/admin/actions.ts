'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { carrierName, trackingUrl } from '@/lib/carriers'
import { buildConfirmationEmail } from '@/lib/email-confirmation'
import { pieceNum } from '@/lib/models'
import { EMAIL_FROM } from '@/lib/email-from'
import { STATUSES, type OrderStatus } from '@/lib/order-status'

export type { OrderStatus }

// Vérifie qu'un admin est connecté avant toute mutation
async function requireAdmin() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) throw new Error('Non autorisé')
  // Liste blanche optionnelle
  const allowlist = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (allowlist.length > 0 && !allowlist.includes((user.email ?? '').toLowerCase())) {
    throw new Error('Non autorisé')
  }
  return user
}

// Change le statut d'une commande
export async function updateOrderStatus(reference: string, status: OrderStatus) {
  await requireAdmin()
  if (!STATUSES.includes(status)) throw new Error('Statut invalide')

  const supabase = createServerClient()
  const patch: Record<string, unknown> = { status }
  if (status === 'payment_received') patch.paid_at = new Date().toISOString()
  if (status === 'confirmed')        patch.confirmed_at = new Date().toISOString()
  if (status === 'shipped')          patch.shipped_at = new Date().toISOString()

  const { error } = await supabase.from('orders').update(patch).eq('reference', reference)
  if (error) throw error

  // Si annulée → libérer les pièces réservées par cette commande
  if (status === 'cancelled') {
    await supabase.from('pieces')
      .update({ status: 'available', order_ref: null, reserved_at: null })
      .eq('order_ref', reference)
  }
  // Si payée/confirmée → marquer les pièces comme vendues
  if (status === 'confirmed' || status === 'payment_received') {
    await supabase.from('pieces').update({ status: 'sold' }).eq('order_ref', reference)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/inventaire')

  // Email automatique au client sur les statuts clés
  if (status === 'payment_received' || status === 'shipped') {
    try {
      await sendStatusEmailInternal(reference, status === 'payment_received' ? 'payment' : 'shipped')
    } catch (e) {
      console.error('[updateOrderStatus] auto email failed (statut bien enregistré)', e)
    }
  }
}

// Met à jour le numéro de suivi + le transporteur
export async function updateTracking(reference: string, tracking: string, carrier?: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('orders')
    .update({ tracking_number: tracking, carrier: carrier ?? null })
    .eq('reference', reference)
  if (error) throw error
  revalidatePath('/admin')
}

// Met à jour les notes internes admin
export async function updateNotes(reference: string, notes: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('orders').update({ notes_admin: notes }).eq('reference', reference)
  if (error) throw error
  revalidatePath('/admin')
}

// Logique interne d'envoi (sans re-vérifier l'admin)
async function sendStatusEmailInternal(reference: string, kind: 'payment' | 'shipped') {
  const supabase = createServerClient()
  const [{ data: order }, { data: pieces }] = await Promise.all([
    supabase.from('orders').select('*').eq('reference', reference).single(),
    supabase.from('pieces').select('model, image_url, display_num').eq('order_ref', reference),
  ])
  if (!order) throw new Error('Commande introuvable')
  const modelNames: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }

  const isFr = order.lang === 'fr'
  const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
  const to = testEmail || order.email
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com').replace(/\s/g, '').replace(/\/$/, '')

  // Objet email personnalisé — prénom en premier pour l'ouverture
  const subject = kind === 'payment'
    ? (isFr
        ? `${order.first_name}, votre paiement est confirmé · Maison Locht`
        : `${order.first_name}, your payment is confirmed · Maison Locht`)
    : (isFr
        ? `${order.first_name}, votre pièce est en route · Maison Locht`
        : `${order.first_name}, your piece is on its way · Maison Locht`)

  const trkUrl = trackingUrl(order.carrier, order.tracking_number)

  // Photos des pièces — 100×100, bien visibles
  const piecesBlock = (pieces ?? []).length > 0 ? `
  <tr><td style="padding:0 40px 28px">
    <p style="margin:0 0 14px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">
      ${isFr ? 'Votre pièce' : 'Your piece'}
    </p>
    <table cellpadding="0" cellspacing="0"><tr>
      ${(pieces ?? []).map(p => `
        <td style="padding-right:16px;vertical-align:top;text-align:center">
          <img src="${p.image_url}" width="100" height="100" alt="${modelNames[p.model] ?? p.model}"
               style="display:block;width:100px;height:100px;object-fit:cover;border:1px solid rgba(4,54,114,0.12)" />
          <p style="margin:7px 0 0;font-family:Georgia,serif;font-size:13px;font-weight:300;color:#043672;font-style:italic">
            ${modelNames[p.model] ?? p.model}
          </p>
          <p style="margin:3px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b8965a">
            N°${String(p.display_num).padStart(2, '00')}
          </p>
        </td>`).join('')}
    </tr></table>
  </td></tr>` : ''

  const html = kind === 'payment' ? `
<!DOCTYPE html>
<html lang="${order.lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">

  <!-- En-tête -->
  <tr><td style="background:#043672;padding:36px 40px;text-align:center">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">
      ${isFr ? 'Paiement confirmé' : 'Payment confirmed'}
    </p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
    <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35)">${reference}</p>
  </td></tr>

  <!-- Message personnel -->
  <tr><td style="padding:36px 40px 8px">
    <p style="margin:0;font-family:Georgia,serif;font-size:23px;font-weight:300;font-style:italic;color:#043672">
      ${isFr ? `${order.first_name}, votre paiement est bien reçu.` : `${order.first_name}, your payment has been received.`}
    </p>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.9;color:#5a5a6a">
      ${isFr
        ? `Votre pièce est désormais entre nos mains — cousue et vérifiée à la main, elle sera préparée avec tout le soin qu'elle mérite.`
        : `Your piece is now in our hands — hand-sewn and inspected, it will be prepared with the greatest care.`}
    </p>
  </td></tr>

  <!-- Photos -->
  ${piecesBlock}

  <!-- Prochaine étape — encadré bien visible -->
  <tr><td style="padding:${(pieces ?? []).length > 0 ? '0' : '8px'} 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #b8965a;background:#f0ebe0">
      <tr><td style="padding:20px 24px">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">
          ${isFr ? 'Prochaine étape' : 'What happens next'}
        </p>
        <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.8">
          ${isFr
            ? 'Vous recevrez un email avec votre numéro de suivi dès que votre pièce sera expédiée.'
            : 'You will receive an email with your tracking number as soon as your piece ships.'}
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA principal — plein, bien visible -->
  <tr><td style="padding:4px 40px 44px;text-align:center">
    <a href="${siteUrl}/commande/${reference}"
       style="display:inline-block;background:#043672;color:#fff;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:18px 48px;text-decoration:none">
      ${isFr ? 'Suivre ma commande' : 'Track my order'} &rarr;
    </a>
  </td></tr>

  <!-- Pied de page -->
  <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
    <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">
      ${isFr ? 'Pièce unique · ni reprise ni échange · ajustements possibles sur demande' : 'One-of-a-kind · no returns or exchanges · adjustments available on request'}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>` : `
<!DOCTYPE html>
<html lang="${order.lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">

  <!-- En-tête -->
  <tr><td style="background:#043672;padding:36px 40px;text-align:center">
    <p style="margin:0 0 12px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">
      ${isFr ? 'Votre pièce arrive' : 'Your piece is on its way'}
    </p>
    <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
    <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.35)">${reference}</p>
  </td></tr>

  <!-- Message personnel -->
  <tr><td style="padding:36px 40px 8px">
    <p style="margin:0;font-family:Georgia,serif;font-size:23px;font-weight:300;font-style:italic;color:#043672">
      ${isFr ? `${order.first_name}, votre pièce est en route.` : `${order.first_name}, your piece is on its way.`}
    </p>
    <p style="margin:14px 0 0;font-size:14px;line-height:1.9;color:#5a5a6a">
      ${isFr
        ? `Elle quitte nos mains pour rejoindre les vôtres. Voici tout ce qu’il vous faut pour suivre son arrivée.`
        : 'It leaves our hands to reach yours. Here is everything you need to track its arrival.'}
    </p>
  </td></tr>

  <!-- Photos -->
  ${piecesBlock}

  <!-- Suivi — très proéminent (fond bleu foncé, numéro en gros) -->
  ${order.tracking_number ? `
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#043672">
      <tr><td style="padding:28px 32px">
        <p style="margin:0 0 6px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#d4aa6a">
          ${isFr ? 'Numéro de suivi' : 'Tracking number'}
        </p>
        ${carrierName(order.carrier) ? `<p style="margin:0 0 12px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.45)">${carrierName(order.carrier)}</p>` : ''}
        <p style="margin:0 0 22px;font-family:Courier,monospace;font-size:22px;color:#fff;letter-spacing:3px;font-weight:600">
          ${order.tracking_number}
        </p>
        ${trkUrl ? `
        <a href="${trkUrl}"
           style="display:inline-block;background:#d4aa6a;color:#021f45;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:15px 36px;text-decoration:none;font-weight:600">
          ${isFr ? 'Suivre mon colis' : 'Track my parcel'} &rarr;
        </a>` : ''}
      </td></tr>
    </table>
  </td></tr>` : `
  <tr><td style="padding:0 40px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-left:4px solid #b8965a;background:#f0ebe0">
      <tr><td style="padding:20px 24px">
        <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.8">
          ${isFr
            ? 'Votre colis est en chemin. Le numéro de suivi sera disponible prochainement.'
            : 'Your parcel is on its way. The tracking number will be available soon.'}
        </p>
      </td></tr>
    </table>
  </td></tr>`}

  <!-- CTA secondaire -->
  <tr><td style="padding:4px 40px 44px;text-align:center">
    <a href="${siteUrl}/commande/${reference}"
       style="display:inline-block;background:#043672;color:#fff;font-size:11px;letter-spacing:3px;text-transform:uppercase;padding:18px 48px;text-decoration:none">
      ${isFr ? 'Voir ma commande' : 'View my order'} &rarr;
    </a>
  </td></tr>

  <!-- Pied de page -->
  <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
    <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">
      ${isFr ? 'Pièce unique · ni reprise ni échange · ajustements possibles sur demande' : 'One-of-a-kind · no returns or exchanges · adjustments available on request'}
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

  await resend.emails.send({ from: EMAIL_FROM, to, subject, html })
}

// Envoie un email manuel au client (paiement reçu / expédié) — bouton admin
export async function sendStatusEmail(reference: string, kind: 'payment' | 'shipped') {
  await requireAdmin()
  try {
    await sendStatusEmailInternal(reference, kind)
  } catch (e) {
    console.error('[sendStatusEmail]', e)
    throw new Error('Échec envoi email')
  }
}

// Renvoie l'email de confirmation original au client
export async function resendConfirmation(reference: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { data: order } = await supabase.from('orders').select('*').eq('reference', reference).single()
  if (!order) throw new Error('Commande introuvable')

  // Récupère les pièces (images) liées à la commande
  const { data: pieces } = await supabase.from('pieces').select('id, model, image_url, display_num').eq('order_ref', reference)
  const modelNames: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }
  const prices: Record<string, number> = { kouna: 285, kami: 328, nafibe: 395 }
  const piecesData = (pieces ?? []).map(p => ({
    modelName: modelNames[p.model] ?? p.model,
    pieceNum: pieceNum(p),
    price: prices[p.model] ?? 0,
    src: p.image_url,
  }))

  const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
  const to = testEmail || order.email
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente-maison-locht.vercel.app').replace(/\s/g, '').replace(/\/$/, '')

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: order.lang === 'fr' ? `Maison Locht — Votre commande ${reference}` : `Maison Locht — Your order ${reference}`,
      html: buildConfirmationEmail({
        data: {
          firstName: order.first_name, bagName: order.bag_name, quantity: order.quantity,
          priceTotal: order.price_total, lang: order.lang, pieces: piecesData,
          address: order.address, city: order.city, province: order.province,
          postalCode: order.postal_code, country: order.country,
          interacAnswer: order.interac_answer ?? undefined,
        },
        reference, baseUrl,
      }),
    })
  } catch (e) {
    console.error('[resendConfirmation]', e)
    throw new Error('Échec envoi email')
  }
}

// Retourne les pièces liées à une commande (pour affichage admin)
export async function getOrderPieces(reference: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { data } = await supabase.from('pieces').select('id, model, image_url, display_num').eq('order_ref', reference)
  return data ?? []
}

// Envoie un email de correction (erreur d'envoi précédent — paiement non encore reçu)
export async function sendCorrectionEmail(reference: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { data: order } = await supabase.from('orders').select('*').eq('reference', reference).single()
  if (!order) throw new Error('Commande introuvable')

  const { data: pieces } = await supabase.from('pieces').select('id, model, image_url, display_num').eq('order_ref', reference)
  const modelNames: Record<string, string> = { kouna: 'Le Kouna', kami: 'Le Kami', nafibe: 'Le Nafibe' }
  const prices: Record<string, number> = { kouna: 285, kami: 328, nafibe: 395 }
  const piecesData = (pieces ?? []).map(p => ({
    modelName: modelNames[p.model] ?? p.model,
    pieceNum: pieceNum(p),
    price: prices[p.model] ?? 0,
    src: p.image_url,
  }))

  const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
  const to = testEmail || order.email
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com').replace(/\s/g, '').replace(/\/$/, '')

  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: order.lang === 'fr'
        ? `Maison Locht — Correction · Votre commande ${reference}`
        : `Maison Locht — Correction · Your order ${reference}`,
      html: buildConfirmationEmail({
        data: {
          firstName: order.first_name, bagName: order.bag_name, quantity: order.quantity,
          priceTotal: order.price_total, lang: order.lang, pieces: piecesData,
          address: order.address, city: order.city, province: order.province,
          postalCode: order.postal_code, country: order.country,
          interacAnswer: order.interac_answer ?? undefined,
          errorCorrection: true,
        },
        reference, baseUrl,
      }),
    })
  } catch (e) {
    console.error('[sendCorrectionEmail]', e)
    throw new Error('Échec envoi email correction')
  }
}

// Libère manuellement une pièce (réservation non payée)
export async function releasePiece(pieceId: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('pieces')
    .update({ status: 'available', order_ref: null, reserved_at: null })
    .eq('id', pieceId)
  if (error) throw error
  revalidatePath('/admin/inventaire')
}

// Change le statut d'une pièce manuellement
export async function setPieceStatus(pieceId: string, status: 'available' | 'reserved' | 'sold') {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('pieces').update({ status }).eq('id', pieceId)
  if (error) throw error
  revalidatePath('/admin/inventaire')
  revalidatePath('/')
}

// Réassigne une pièce à un autre modèle et/ou change son numéro d'affichage
export async function reassignPiece(pieceId: string, model: 'kouna' | 'kami' | 'nafibe', displayNum: number) {
  await requireAdmin()
  if (!['kouna', 'kami', 'nafibe'].includes(model)) throw new Error('Modèle invalide')
  const supabase = createServerClient()
  const { error } = await supabase.from('pieces')
    .update({ model, display_num: displayNum })
    .eq('id', pieceId)
  if (error) throw error
  revalidatePath('/admin/inventaire')
  revalidatePath('/')
}

// Upload une image vers Supabase Storage (compressée) → retourne l'URL publique
async function uploadImage(file: File, keyHint: string): Promise<string> {
  const supabase = createServerClient()
  const raw = Buffer.from(await file.arrayBuffer())

  // Compression : redimensionne à 1600px + JPEG qualité 80 (cohérent avec le site)
  let out: Uint8Array = raw
  let contentType = file.type || 'image/jpeg'
  try {
    const sharp = (await import('sharp')).default
    out = await sharp(raw).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true }).toBuffer()
    contentType = 'image/jpeg'
  } catch {
    // sharp indisponible → upload brut
  }

  const path = `${keyHint}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('bags').upload(path, out, { contentType, upsert: true })
  if (error) throw error
  return supabase.storage.from('bags').getPublicUrl(path).data.publicUrl
}

// Ajoute une nouvelle pièce (avec upload d'image)
export async function addPiece(formData: FormData) {
  await requireAdmin()
  const model = String(formData.get('model'))
  const displayNum = parseInt(String(formData.get('displayNum')), 10) || 1
  const file = formData.get('image') as File | null
  if (!['kouna', 'kami', 'nafibe'].includes(model)) throw new Error('Modèle invalide')
  if (!file || file.size === 0) throw new Error('Image requise')

  const id = `${model}-${Date.now().toString(36)}`
  const imageUrl = await uploadImage(file, id)

  const supabase = createServerClient()
  const { error } = await supabase.from('pieces').insert({
    id, model, image_url: imageUrl, status: 'available',
    display_num: displayNum, sort_order: displayNum,
  })
  if (error) throw error
  revalidatePath('/admin/inventaire')
  revalidatePath('/')
}

// Change l'image d'une pièce existante
export async function changePieceImage(pieceId: string, formData: FormData) {
  await requireAdmin()
  const file = formData.get('image') as File | null
  if (!file || file.size === 0) throw new Error('Image requise')
  const imageUrl = await uploadImage(file, pieceId)
  const supabase = createServerClient()
  const { error } = await supabase.from('pieces').update({ image_url: imageUrl }).eq('id', pieceId)
  if (error) throw error
  revalidatePath('/admin/inventaire')
  revalidatePath('/')
}

// Supprime une pièce (seulement si pas liée à une commande active)
export async function deletePiece(pieceId: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { data: piece } = await supabase.from('pieces').select('status').eq('id', pieceId).single()
  if (piece && piece.status !== 'available') {
    throw new Error('Impossible de supprimer une pièce réservée ou vendue')
  }
  const { error } = await supabase.from('pieces').delete().eq('id', pieceId)
  if (error) throw error
  revalidatePath('/admin/inventaire')
  revalidatePath('/')
}
