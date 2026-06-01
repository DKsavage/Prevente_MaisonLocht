'use server'

import { revalidatePath } from 'next/cache'
import { createAuthClient } from '@/lib/supabase-auth'
import { createServerClient } from '@/lib/supabase-server'
import { resend } from '@/lib/resend'

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

// Met à jour le numéro de suivi
export async function updateTracking(reference: string, tracking: string) {
  await requireAdmin()
  const supabase = createServerClient()
  const { error } = await supabase.from('orders').update({ tracking_number: tracking }).eq('reference', reference)
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

  const subject = kind === 'payment'
    ? (isFr ? `Maison Locht — Paiement reçu (${reference})` : `Maison Locht — Payment received (${reference})`)
    : (isFr ? `Maison Locht — Votre commande est expédiée (${reference})` : `Maison Locht — Your order has shipped (${reference})`)

  const body = kind === 'payment'
    ? (isFr
        ? `<p>Bonjour ${order.first_name},</p><p>Nous confirmons la réception de votre paiement pour la commande <strong>${reference}</strong>. Votre pièce est en préparation.</p>`
        : `<p>Hello ${order.first_name},</p><p>We confirm receipt of your payment for order <strong>${reference}</strong>. Your piece is being prepared.</p>`)
    : (isFr
        ? `<p>Bonjour ${order.first_name},</p><p>Votre commande <strong>${reference}</strong> a été expédiée.${order.tracking_number ? ` Numéro de suivi : <strong>${order.tracking_number}</strong>.` : ''}</p>`
        : `<p>Hello ${order.first_name},</p><p>Your order <strong>${reference}</strong> has shipped.${order.tracking_number ? ` Tracking number: <strong>${order.tracking_number}</strong>.` : ''}</p>`)

  try {
    await resend.emails.send({
      from: 'Maison Locht <onboarding@resend.dev>',
      to,
      subject,
      html: `<div style="font-family:Helvetica,Arial,sans-serif;color:#1a1a2e;font-size:14px;line-height:1.7">${body}<p style="margin-top:24px;font-size:11px;color:#7a7a8a">Maison Locht · Pièces uniques, jamais reproduites</p></div>`,
    })
  } catch (e) {
    console.error('[sendStatusEmail]', e)
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
