import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase-server'
import { COUNTRIES } from '@/lib/countries'
import { carrierName, trackingUrl } from '@/lib/carriers'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

const STEPS = ['pending', 'payment_received', 'confirmed', 'shipped'] as const

const copy = {
  fr: {
    eyebrow: 'Suivi de commande',
    ref: 'Référence',
    notFoundTitle: 'Commande introuvable',
    notFoundSub: 'Vérifiez votre code de référence. Il vous a été envoyé par courriel.',
    backHome: 'Retour à l\'accueil',
    pieces: 'Vos pièces',
    delivery: 'Livraison',
    tracking: 'Numéro de suivi',
    total: 'Total',
    cancelled: 'Commande annulée',
    cancelledSub: 'Cette commande a été annulée. Contactez-nous pour toute question.',
    steps: {
      pending: { label: 'Commande reçue', desc: 'En attente de votre paiement' },
      payment_received: { label: 'Paiement reçu', desc: 'Votre paiement est confirmé' },
      confirmed: { label: 'Confirmée', desc: 'Votre pièce est en préparation' },
      shipped: { label: 'Expédiée', desc: 'Votre pièce est en route' },
    },
    finalSale: 'Pièce unique · ni reprise ni échange. Des ajustements sur le sac restent possibles sur demande.',
    piece: 'Pièce',
  },
  en: {
    eyebrow: 'Order tracking',
    ref: 'Reference',
    notFoundTitle: 'Order not found',
    notFoundSub: 'Check your reference code. It was sent to you by email.',
    backHome: 'Back to home',
    pieces: 'Your pieces',
    delivery: 'Delivery',
    tracking: 'Tracking number',
    total: 'Total',
    cancelled: 'Order cancelled',
    cancelledSub: 'This order has been cancelled. Contact us with any questions.',
    steps: {
      pending: { label: 'Order received', desc: 'Awaiting your payment' },
      payment_received: { label: 'Payment received', desc: 'Your payment is confirmed' },
      confirmed: { label: 'Confirmed', desc: 'Your piece is being prepared' },
      shipped: { label: 'Shipped', desc: 'Your piece is on its way' },
    },
    finalSale: 'One-of-a-kind · no returns or exchanges. Adjustments to the bag remain available on request.',
    piece: 'Piece',
  },
}

export default async function TrackingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const reference = decodeURIComponent(code)

  const supabase = createServerClient()
  const { data: order } = await supabase
    .from('orders')
    .select('reference, status, bag_name, quantity, price_total, first_name, city, country, lang, tracking_number, carrier, created_at')
    .eq('reference', reference)
    .single()

  const lang: 'fr' | 'en' = (order?.lang === 'en' ? 'en' : 'fr')
  const t = copy[lang]

  // Page introuvable
  if (!order) {
    return (
      <main className="min-h-screen bg-[#ede8df] flex items-center justify-center px-6">
        <div className="text-center max-w-[380px]">
          <Image src="/images/logo-bleu.png" alt="Maison Locht" width={150} height={34} className="h-8 w-auto mx-auto mb-8" />
          <h1 className="font-display text-[28px] font-light text-[#043672] mb-2">{t.notFoundTitle}</h1>
          <p className="text-[13px] text-[#7a7a8a] font-light mb-6">{t.notFoundSub}</p>
          <Link href="/" className="text-label text-[9px] text-[#043672] tracking-[3px] border border-[#043672]/20 hover:border-[#043672] px-5 py-3 inline-block transition-colors">
            {t.backHome}
          </Link>
        </div>
      </main>
    )
  }

  // Pièces de la commande (images via order_ref)
  const { data: pieces } = await supabase
    .from('pieces')
    .select('id, image_url, display_num, model')
    .eq('order_ref', reference)

  const countryName = COUNTRIES.find(c => c.code === order.country)
  const countryLabel = countryName ? (lang === 'fr' ? countryName.name : countryName.nameEn) : order.country
  const isCancelled = order.status === 'cancelled'
  const currentStep = STEPS.indexOf(order.status as typeof STEPS[number])

  return (
    <main className="min-h-screen bg-[#ede8df] py-12 px-6">
      {/* Rafraîchit le statut automatiquement (sauf si terminé/annulé) */}
      {!isCancelled && order.status !== 'shipped' && <AutoRefresh seconds={30} />}
      <div className="max-w-[560px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/"><Image src="/images/logo-bleu.png" alt="Maison Locht" width={150} height={34} className="h-8 w-auto mx-auto mb-6" /></Link>
          <p className="text-label text-[9px] text-[#b8965a] tracking-[5px] mb-3">{t.eyebrow}</p>
          <p className="font-display text-[30px] font-light text-[#043672] tracking-[3px]">{order.reference}</p>
        </div>

        <div className="bg-[#faf7f2] border border-[#043672]/08">
          {isCancelled ? (
            <div className="p-8 text-center">
              <p className="font-display text-[22px] font-light text-[#043672] mb-2">{t.cancelled}</p>
              <p className="text-[12px] text-[#7a7a8a] font-light">{t.cancelledSub}</p>
            </div>
          ) : (
            /* Timeline */
            <div className="p-8 flex flex-col gap-0">
              {STEPS.map((step, i) => {
                const done = i <= currentStep
                const active = i === currentStep
                const s = t.steps[step]
                return (
                  <div key={step} className="flex gap-4">
                    {/* Indicateur + ligne */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] flex-shrink-0 transition-colors ${
                        done ? 'bg-[#043672] text-white' : 'bg-[#e2ddd4] text-[#7a7a8a]'
                      } ${active ? 'ring-2 ring-[#b8965a] ring-offset-2 ring-offset-[#faf7f2]' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-px flex-1 min-h-[36px] ${i < currentStep ? 'bg-[#043672]' : 'bg-[#e2ddd4]'}`} />
                      )}
                    </div>
                    {/* Texte */}
                    <div className={`pb-8 ${done ? '' : 'opacity-50'}`}>
                      <p className="text-[14px] text-[#043672] font-light">{s.label}</p>
                      <p className="text-[11px] text-[#7a7a8a] mt-0.5">{s.desc}</p>
                      {step === 'shipped' && order.tracking_number && done && (
                        <div className="mt-2">
                          <p className="text-label text-[8px] text-[#b8965a] tracking-[2px]">
                            {carrierName(order.carrier) ? `${carrierName(order.carrier)} · ` : ''}{t.tracking} : <span className="text-[#043672]">{order.tracking_number}</span>
                          </p>
                          {trackingUrl(order.carrier, order.tracking_number) && (
                            <a href={trackingUrl(order.carrier, order.tracking_number)} target="_blank" rel="noopener noreferrer"
                              className="inline-block mt-2 text-label text-[8px] text-white tracking-[2px] bg-[#043672] hover:bg-[#0a4d9e] px-4 py-2 transition-colors">
                              {lang === 'fr' ? 'Suivre mon colis' : 'Track my parcel'} →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pièces */}
          {pieces && pieces.length > 0 && (
            <div className="border-t border-[#043672]/08 p-8">
              <p className="text-label text-[8px] text-[#b8965a] tracking-[4px] mb-4">{t.pieces}</p>
              <div className="flex flex-col gap-3">
                {pieces.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 flex-shrink-0 bg-[#f0ebe0]">
                      <Image src={p.image_url} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1">
                      <span className="font-display text-[16px] font-light text-[#043672]">
                        {p.model === 'kouna' ? 'Le Kouna' : p.model === 'kami' ? 'Le Kami' : 'Le Nafibe'}
                      </span>
                      <span className="text-label text-[8px] text-[#7a7a8a] tracking-[2px] block">
                        {t.piece} N°{String(p.display_num ?? '').padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline mt-5 pt-4 border-t border-[#043672]/06">
                <span className="text-label text-[8px] text-[#7a7a8a] tracking-[3px]">{t.total}</span>
                <span className="font-display text-[22px] font-light text-[#043672]">{order.price_total} <span className="text-[13px] text-[#7a7a8a]">CAD</span></span>
              </div>
            </div>
          )}

          {/* Livraison (ville/pays uniquement — pas d'adresse complète) */}
          <div className="border-t border-[#043672]/08 px-8 py-5 flex justify-between items-center">
            <span className="text-label text-[8px] text-[#b8965a] tracking-[3px]">{t.delivery}</span>
            <span className="text-[12px] text-[#043672] font-light">{order.city}, {countryLabel}</span>
          </div>
        </div>

        {/* Vente finale */}
        <p className="text-label text-[8px] text-[#7a7a8a] tracking-[1px] text-center leading-relaxed mt-6 px-4">
          {t.finalSale}
        </p>
      </div>
    </main>
  )
}
