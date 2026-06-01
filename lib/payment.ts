// Routage du paiement selon le pays.
// Canada → Interac.  Tout autre pays → virement sur le compte belge.

export const INTERAC_EMAIL = 'Ml@maisonlocht.com'

// Coordonnées du compte belge (virements Europe + reste du monde)
export const BANK_DETAILS = {
  holder: 'Locht Anouk',
  iban:   'BE98 0636 5034 2393',
  bic:    'GKCCBEBB',
  bankName: 'Belfius',
}

export type PaymentMethod = 'interac' | 'bank'

export function getPaymentMethod(country: string): PaymentMethod {
  return country === 'CA' ? 'interac' : 'bank'
}

// Texte d'instructions bilingue selon la méthode
export function paymentInstructions(method: PaymentMethod, reference: string, lang: 'fr' | 'en') {
  if (method === 'interac') {
    return {
      title: lang === 'fr' ? 'Paiement par virement Interac' : 'Payment by Interac transfer',
      lines: lang === 'fr'
        ? [
            `Effectuez un virement Interac à <strong>${INTERAC_EMAIL}</strong>`,
            `Indiquez la référence <strong>${reference}</strong> dans le message.`,
          ]
        : [
            `Send an Interac transfer to <strong>${INTERAC_EMAIL}</strong>`,
            `Include reference <strong>${reference}</strong> in the message.`,
          ],
      fields: [{ label: lang === 'fr' ? 'Adresse Interac' : 'Interac address', value: INTERAC_EMAIL }],
    }
  }
  // Virement bancaire (Europe + reste du monde)
  return {
    title: lang === 'fr' ? 'Paiement par virement bancaire' : 'Payment by bank transfer',
    lines: lang === 'fr'
      ? [
          `Effectuez un virement <strong>SEPA / international</strong> vers le compte ci-dessous.`,
          `Indiquez la référence <strong>${reference}</strong> en communication.`,
        ]
      : [
          `Make a <strong>SEPA / international</strong> transfer to the account below.`,
          `Include reference <strong>${reference}</strong> in the payment description.`,
        ],
    fields: [
      { label: lang === 'fr' ? 'Titulaire' : 'Account holder', value: BANK_DETAILS.holder },
      { label: 'IBAN', value: BANK_DETAILS.iban },
      { label: 'BIC / SWIFT', value: BANK_DETAILS.bic },
    ],
  }
}
