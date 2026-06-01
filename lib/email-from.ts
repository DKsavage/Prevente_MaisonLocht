// Adresse expéditrice unique pour tous les emails.
//
// Tant que le domaine n'est PAS vérifié dans Resend → onboarding@resend.dev
// (n'envoie qu'à l'email du compte Resend).
//
// Une fois maisonlocht.com vérifié sur le compte Resend dont la clé est
// utilisée → remplacer par :  'Maison Locht <ml@maisonlocht.com>'
export const EMAIL_FROM = 'Maison Locht <onboarding@resend.dev>'
