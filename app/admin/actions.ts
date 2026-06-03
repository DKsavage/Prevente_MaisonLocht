'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'
import { buildConfirmationEmail } from '@/lib/email-confirmation'
import { buildStatusEmail, statusEmailSubject } from '@/lib/email-status'
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

  const isFr = order.lang === 'fr'
  const testEmail = (process.env.RESEND_TEST_EMAIL ?? '').replace(/\s/g, '')
  const to = testEmail || order.email
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://prevente.maisonlocht.com').replace(/\s/g, '').replace(/\/$/, '')

  const subject = statusEmailSubject(kind, order.first_name, isFr)
  const html = buildStatusEmail(kind, {
    reference,
    firstName:      order.first_name,
    lang:           order.lang,
    carrier:        order.carrier,
    trackingNumber: order.tracking_number,
    pieces:         pieces ?? [],
    baseUrl,
  })

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
