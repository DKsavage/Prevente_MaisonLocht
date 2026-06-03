// Adresse expéditrice unique pour tous les emails.
//
// Tant que le domaine n'est PAS vérifié dans Resend → onboarding@resend.dev
// (n'envoie qu'à l'email du compte Resend).
//
// Une fois maisonlocht.com vérifié sur le compte Resend dont la clé est
// utilisée → remplacer par :  'Maison Locht <ml@maisonlocht.com>'
export const EMAIL_FROM = 'Maison Locht <ml@maisonlocht.com>'

// Normalise une image de pièce en URL absolue pour les emails.
// Les pièces ont soit une URL Supabase complète (https://…), soit un chemin
// relatif seed (/images/…). Les clients mail exigent une URL absolue : un
// chemin relatif ne s'affiche pas, et préfixer une URL déjà absolue la casse.
export function emailImg(src: string, baseUrl: string) {
  return /^https?:\/\//.test(src) ? src : `${baseUrl}${src}`
}
