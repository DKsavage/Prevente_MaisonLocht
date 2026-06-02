// Routage du paiement selon le pays.
// Canada → Interac.  Tout autre pays → virement sur le compte belge.

export const INTERAC_EMAIL = 'anouklocht2003@gmail.com'
export const INTERAC_SECURITY_QUESTION = {
  fr: 'Quel est le nom de la collection ?',
  en: 'What is the collection name?',
}

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

// Génère une réponse de sécurité Interac liée à la DA (ex: Cernes4827)
export function generateInteracAnswer(): string {
  return `Cernes${Math.floor(1000 + Math.random() * 9000)}`
}

// Texte d'instructions bilingue selon la méthode
export function paymentInstructions(method: PaymentMethod, reference: string, lang: 'fr' | 'en', interacAnswer?: string) {
  if (method === 'interac') {
    const question = lang === 'fr' ? INTERAC_SECURITY_QUESTION.fr : INTERAC_SECURITY_QUESTION.en
    return {
      title: lang === 'fr' ? 'Paiement par virement Interac' : 'Payment by Interac transfer',
      lines: [
        lang === 'fr'
          ? `Effectuez un virement Interac à <strong>${INTERAC_EMAIL}</strong>`
          : `Send an Interac transfer to <strong>${INTERAC_EMAIL}</strong>`,
        lang === 'fr'
          ? `Indiquez la référence <strong>${reference}</strong> dans le message.`
          : `Include reference <strong>${reference}</strong> in the message.`,
        ...(interacAnswer ? [
          lang === 'fr'
            ? `Question de sécurité : <strong>${question}</strong>`
            : `Security question: <strong>${question}</strong>`,
          lang === 'fr'
            ? `Réponse : <strong>${interacAnswer}</strong>`
            : `Answer: <strong>${interacAnswer}</strong>`,
        ] : []),
      ],
      fields: [
        { label: lang === 'fr' ? 'Adresse Interac' : 'Interac address', value: INTERAC_EMAIL },
        ...(interacAnswer ? [
          { label: lang === 'fr' ? 'Question de sécurité' : 'Security question', value: question },
          { label: lang === 'fr' ? 'Réponse' : 'Answer', value: interacAnswer },
        ] : []),
      ],
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
