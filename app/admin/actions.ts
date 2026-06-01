'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { carrierName, trackingUrl } from '@/lib/carriers'
import { buildConfirmationEmail } from '@/lib/email-confirmation'
import { pieceNum } from '@/lib/models'

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

const STATUSES = ['pending', 'payment_received', 'confirmed', 'shipped', 'cancelled'] as const
export type OrderStatus = typeof STATUSES[number]

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

// Envoie un email manuel au client (paiement reçu / expédié)
export async function sendStatusEmail(reference: string, kind: 'payment' | 'shipped') {
  await requireAdmin()
  const supabase = createServerClient()
  const { data: order } = await supabase.from('orders').select('*').eq('reference', reference).single()
  if (!order) throw new Error('Commande introuvable')

  const isFr = order.lang === 'fr'
  const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
  const to = testEmail || order.email

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente-maison-locht.vercel.app').replace(/\s/g, '').replace(/\/$/, '')

  const subject = kind === 'payment'
    ? (isFr ? `Maison Locht — Paiement reçu · ${reference}` : `Maison Locht — Payment received · ${reference}`)
    : (isFr ? `Maison Locht — Votre commande est expédiée · ${reference}` : `Maison Locht — Your order has shipped · ${reference}`)

  const eyebrow = kind === 'payment'
    ? (isFr ? 'Paiement reçu' : 'Payment received')
    : (isFr ? 'Commande expédiée' : 'Order shipped')

  const greeting = isFr ? `Merci, ${order.first_name}.` : `Thank you, ${order.first_name}.`

  const intro = kind === 'payment'
    ? (isFr ? `Nous confirmons la réception de votre paiement. Votre pièce est désormais en préparation, cousue et vérifiée à la main.`
            : `We confirm receipt of your payment. Your piece is now being prepared, hand-sewn and inspected.`)
    : (isFr ? `Votre pièce est en route. Voici les informations pour suivre votre colis.`
            : `Your piece is on its way. Here is the information to track your parcel.`)

  // Bloc suivi transporteur
  const trkUrl = trackingUrl(order.carrier, order.tracking_number)
  const trackingBlock = (kind === 'shipped' && order.tracking_number)
    ? `<tr><td style="padding:0 40px 8px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe0;border-radius:0">
          <tr><td style="padding:20px 24px">
            <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#b8965a">${isFr ? 'Suivi du colis' : 'Parcel tracking'}</p>
            <p style="margin:0;font-size:13px;color:#1a1a2e;line-height:1.7">${carrierName(order.carrier) ? `${carrierName(order.carrier)}<br>` : ''}<strong>${order.tracking_number}</strong></p>
            ${trkUrl ? `<a href="${trkUrl}" style="display:inline-block;margin-top:12px;background:#043672;color:#fff;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:12px 24px;text-decoration:none">${isFr ? 'Suivre mon colis' : 'Track my parcel'} &rarr;</a>` : ''}
          </td></tr>
        </table>
      </td></tr>`
    : ''

  const html = `
<!DOCTYPE html>
<html lang="${order.lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ede8df;font-family:Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid rgba(4,54,114,0.08);max-width:580px;width:100%">
        <!-- Header -->
        <tr><td style="background:#043672;padding:40px;text-align:center">
          <p style="margin:0 0 14px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#d4aa6a">${eyebrow}</p>
          <h1 style="margin:0;font-family:Georgia,serif;font-size:30px;font-weight:300;color:#fff;letter-spacing:3px">Maison Locht</h1>
          <p style="margin:8px 0 0;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4)">${reference}</p>
        </td></tr>
        <!-- Corps -->
        <tr><td style="padding:36px 40px 24px">
          <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:300;font-style:italic;color:#043672">${greeting}</p>
          <p style="margin:12px 0 0;font-size:13px;line-height:1.8;color:#7a7a8a">${intro}</p>
        </td></tr>
        ${trackingBlock}
        <!-- Suivi en ligne -->
        <tr><td style="padding:16px 40px 28px;text-align:center">
          <a href="${siteUrl}/commande/${reference}" style="display:inline-block;border:1px solid rgba(4,54,114,0.2);color:#043672;font-size:10px;letter-spacing:3px;text-transform:uppercase;padding:13px 28px;text-decoration:none">${isFr ? 'Voir ma commande' : 'View my order'} &rarr;</a>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;background:#021f45;text-align:center">
          <p style="margin:0;font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase">${isFr ? 'Pièce unique · ni reprise ni échange · ajustements possibles' : 'One-of-a-kind · no returns or exchanges · adjustments available'}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({ from: 'Maison Locht <onboarding@resend.dev>', to, subject, html })
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
      from: 'Maison Locht <onboarding@resend.dev>',
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
