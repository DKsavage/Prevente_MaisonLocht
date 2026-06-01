import { Resend } from 'resend'

// Nettoie la clé — un copier-coller dans Vercel peut ajouter espaces/retours à la ligne.
export const resend = new Resend((process.env.RESEND_API_KEY ?? '').replace(/\s/g, ''))
