// Transporteurs supportés + génération du lien de suivi
export const CARRIERS: { id: string; name: string; url: (t: string) => string }[] = [
  { id: 'postescanada', name: 'Postes Canada', url: t => `https://www.canadapost-postescanada.ca/track-reperage/fr#/search?searchFor=${encodeURIComponent(t)}` },
  { id: 'purolator',    name: 'Purolator',     url: t => `https://www.purolator.com/fr/suivi-de-colis?pin=${encodeURIComponent(t)}` },
  { id: 'ups',          name: 'UPS',           url: t => `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}` },
  { id: 'fedex',        name: 'FedEx',         url: t => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}` },
  { id: 'dhl',          name: 'DHL',           url: t => `https://www.dhl.com/fr-fr/home/suivi.html?tracking-id=${encodeURIComponent(t)}` },
  { id: 'colissimo',    name: 'Colissimo',     url: t => `https://www.laposte.fr/outils/suivre-vos-envois?code=${encodeURIComponent(t)}` },
  { id: 'bpost',        name: 'bpost',         url: t => `https://track.bpost.cloud/btr/web/#/search?itemCode=${encodeURIComponent(t)}` },
  { id: 'autre',        name: 'Autre',         url: () => '' },
]

export function carrierName(id?: string | null) {
  return CARRIERS.find(c => c.id === id)?.name ?? null
}

// Lien de suivi (vide si transporteur inconnu/Autre)
export function trackingUrl(carrierId: string | null | undefined, tracking: string | null | undefined): string {
  if (!carrierId || !tracking) return ''
  const c = CARRIERS.find(c => c.id === carrierId)
  return c ? c.url(tracking) : ''
}
