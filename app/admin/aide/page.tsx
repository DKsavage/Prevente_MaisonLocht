import { createAuthClient } from '@/lib/supabase-auth'
import AdminShell from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

// Guide d'utilisation in-app — destiné à la designeuse (non-technique).
// Rendu statique stylé (charte Maison Locht), pas de logique client.

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[24px] font-light text-[#043672] mb-3">{children}</h2>
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#faf7f2] border border-[#043672]/08 p-6 flex flex-col gap-3">{children}</div>
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#043672] text-white text-[11px] flex items-center justify-center font-medium">{n}</span>
      <p className="text-[13px] text-[#1a1a2e] font-light leading-relaxed pt-0.5">{children}</p>
    </div>
  )
}

export default async function AdminHelpPage() {
  const auth = await createAuthClient()
  const { data: { user } } = await auth.auth.getUser()

  const statuses = ['En attente', 'Payée', 'Confirmée', 'Expédiée']

  return (
    <AdminShell email={user?.email}>
      <div className="flex flex-col gap-8 max-w-[760px]">

        {/* En-tête */}
        <div>
          <p className="text-label text-[10px] text-[#b8965a] tracking-[4px] uppercase mb-2">Guide</p>
          <h1 className="font-display text-[32px] font-light text-[#043672]">Gérer les commandes</h1>
          <p className="text-[14px] text-[#7a7a8a] font-light mt-2 leading-relaxed">
            Tout ce qu&apos;il faut savoir pour suivre et gérer les commandes, en quelques minutes.
          </p>
        </div>

        {/* Parcours */}
        <section>
          <SectionTitle>Le parcours d&apos;une commande</SectionTitle>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              {statuses.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-label text-[10px] tracking-[1px] uppercase px-3 py-1.5 bg-[#043672] text-white">{s}</span>
                  {i < statuses.length - 1 && <span className="text-[#b8965a]">→</span>}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[#1a1a2e] font-light leading-relaxed mt-2">
              À chaque étape, la cliente est tenue au courant automatiquement :
            </p>
            <ul className="flex flex-col gap-2 text-[13px] text-[#1a1a2e] font-light">
              <li>• Tu passes à <strong>Payée</strong> → elle reçoit un email « Paiement confirmé ».</li>
              <li>• Tu passes à <strong>Confirmée</strong> → rien (c&apos;est une étape interne pour toi).</li>
              <li>• Tu passes à <strong>Expédiée</strong> → elle reçoit « En route » avec le numéro de suivi.</li>
            </ul>
          </Card>
        </section>

        {/* Faire avancer */}
        <section>
          <SectionTitle>Faire avancer une commande</SectionTitle>
          <Card>
            <Step n={1}>Clique sur la ligne d&apos;une commande pour l&apos;ouvrir.</Step>
            <Step n={2}>
              Regarde la <strong>Progression</strong> (les ronds) : le rond <span className="text-[#043672] font-medium">bleu</span> est l&apos;étape actuelle, les ronds <strong>suivants</strong> se cliquent pour avancer (tu peux sauter une étape), les ronds <span className="text-emerald-600 font-medium">verts ✓</span> sont les étapes déjà faites.
            </Step>
            <p className="text-[12px] text-[#7a7a8a] font-light italic border-l-2 border-[#b8965a] pl-3">
              Astuce : sur la ligne fermée, le petit bouton « Payée » est un raccourci quand une commande attend son paiement.
            </p>
          </Card>
        </section>

        {/* Expédier */}
        <section>
          <SectionTitle>Expédier un colis</SectionTitle>
          <Card>
            <Step n={1}>Ouvre la commande → partie <strong>Expédition &amp; suivi</strong>.</Step>
            <Step n={2}>Choisis le <strong>transporteur</strong> et tape le <strong>numéro de suivi</strong>.</Step>
            <Step n={3}>
              Clique <strong>« Expédier &amp; notifier »</strong> → ça enregistre le suivi, marque la commande expédiée et envoie l&apos;email à la cliente avec le numéro. <strong>Tout en un clic.</strong>
            </Step>
            <div className="border-t border-[#043672]/08 pt-3 mt-1">
              <p className="text-label text-[10px] text-[#b8965a] tracking-[2px] uppercase mb-1">Tu t&apos;es trompée de numéro ?</p>
              <p className="text-[13px] text-[#1a1a2e] font-light leading-relaxed">
                Corrige-le, clique <strong>« Enregistrer »</strong>, puis <strong>« ↩ Renvoyer : Commande expédiée »</strong> pour renvoyer le bon numéro. Le numéro de suivi se modifie quand tu veux — le numéro de commande (LOCHT-…), lui, ne change jamais.
              </p>
            </div>
          </Card>
        </section>

        {/* Emails */}
        <section>
          <SectionTitle>Renvoyer un email à la cliente</SectionTitle>
          <Card>
            <p className="text-[13px] text-[#1a1a2e] font-light leading-relaxed">
              Dans la commande ouverte, partie <strong>Communications client</strong> :
            </p>
            <ul className="flex flex-col gap-2 text-[13px] text-[#1a1a2e] font-light">
              <li>• <strong>↩ Renvoyer confirmation</strong> — la confirmation + les instructions de paiement.</li>
              <li>• <strong>↩ Renvoyer : Paiement confirmé</strong> / <strong>Commande expédiée</strong>.</li>
              <li>• <strong>⚠ Email correction</strong> — un mot d&apos;excuse si un email est parti par erreur.</li>
            </ul>
          </Card>
        </section>

        {/* Clic-pour-armer */}
        <section>
          <SectionTitle>Les boutons qui demandent confirmation</SectionTitle>
          <Card>
            <p className="text-[13px] text-[#1a1a2e] font-light leading-relaxed">
              Pour éviter les fausses manips, les boutons importants demandent <strong>deux clics</strong> :
            </p>
            <Step n={1}>Le bouton devient <span className="text-[#b8965a] font-medium">doré</span> et affiche « Confirmer ? ».</Step>
            <Step n={2}>Re-clique pour confirmer l&apos;action.</Step>
            <p className="text-[12px] text-[#7a7a8a] font-light italic">
              Tu changes d&apos;avis ? Ne re-clique pas : le bouton redevient normal tout seul après quelques secondes.
            </p>
          </Card>
        </section>

        {/* Retrouver */}
        <section>
          <SectionTitle>Retrouver une commande</SectionTitle>
          <Card>
            <ul className="flex flex-col gap-2 text-[13px] text-[#1a1a2e] font-light">
              <li>• <strong>Barre de recherche</strong> : un nom, un email ou un numéro de commande.</li>
              <li>• <strong>Tri</strong> : du plus récent au plus ancien, ou par montant.</li>
              <li>• <strong>Les étiquettes</strong> en haut filtrent la liste (Toutes, par statut…).</li>
              <li>• <strong>⚠ En retard</strong> : en attente de paiement depuis plus de 3 jours → à relancer.</li>
            </ul>
            <p className="text-[12px] text-[#7a7a8a] font-light italic">
              La liste se rafraîchit toute seule ; le bouton ↻ force une mise à jour immédiate.
            </p>
          </Card>
        </section>

        {/* La fiche */}
        <section>
          <SectionTitle>La fiche d&apos;une commande</SectionTitle>
          <Card>
            <ul className="flex flex-col gap-2 text-[13px] text-[#1a1a2e] font-light">
              <li>• <strong>Pièces</strong> : les photos des sacs commandés.</li>
              <li>• <strong>Infos cliente</strong> : email, téléphone, adresse — bouton <strong>Copier</strong> pour l&apos;étiquette d&apos;envoi.</li>
              <li>• <strong>Note à glisser dans le colis</strong> : un petit mot personnalisé déjà rédigé — bouton <strong>Copier</strong> pour l&apos;imprimer.</li>
              <li>• <strong>Note interne</strong> : tes notes privées, jamais visibles par la cliente.</li>
            </ul>
          </Card>
        </section>

        <p className="text-[13px] text-[#7a7a8a] font-light text-center py-4">
          Un doute ? Demande à Dimitri. 💛
        </p>
      </div>
    </AdminShell>
  )
}
