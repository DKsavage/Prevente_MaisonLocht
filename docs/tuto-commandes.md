# 📋 Tuto — Dashboard Commandes

Guide d'utilisation de la section **Commandes** (`/admin/commandes`).

---

## 1. La page se met à jour seule

Elle se rafraîchit **toutes les 30 secondes** automatiquement.
Le bouton **↻** force un rafraîchissement immédiat.

## 2. Trouver une commande

**Barre de recherche** — tape une **référence**, un **nom** ou un **email**.

**Tri** (menu déroulant) :
- Plus récentes (défaut) / Plus anciennes
- Montant ↓ (plus cher d'abord) / Montant ↑

**Filtres** (les puces) :
- `Toutes (n)`
- `⚠ En retard (n)` — apparaît seulement s'il y en a. = commande **en attente depuis +3 jours** (paiement jamais reçu → à relancer).
- Une puce **par statut** (avec le compte). Clique pour ne voir que celles-là.

**CSV (n)** — télécharge la liste **actuellement filtrée** en Excel (séparateur `;`). Pratique pour la compta.

## 3. Le cycle d'une commande

```
En attente → Payée → Confirmée → Expédiée
(pending)   (payment) (confirmed) (shipped)        + Annulée
```

| Passage | Email auto au client |
|---|---|
| → **Payée** | ✉️ « Paiement confirmé » |
| → **Confirmée** | ❌ aucun (jalon interne) |
| → **Expédiée** | ✉️ « En route » (avec le N° de suivi) |

## 4. Faire avancer une commande

**Clique une ligne** pour la déplier. Tu vois la **Progression commande** (les ronds) :
- Rond **bleu** = statut actuel.
- Ronds **suivants** = cliquables (tu peux **sauter directement**, ex. Payée → Expédiée).
- Rond **vert ✓** = étapes passées.

> 💡 La petite pastille « Payée » sur la ligne **repliée** = raccourci quand la commande est en attente.

## 5. Expédier (le flux complet)

Dans la commande dépliée → section **Expédition & suivi** :

1. Choisis le **transporteur** + tape le **N° de suivi**.
2. **« Expédier & notifier »** → en 1 clic : enregistre le suivi + passe à Expédiée + envoie l'email « En route » **avec le numéro**.
3. **« Enregistrer »** (à côté) = sauve le N° **sans** envoyer (pour préparer ou **corriger** un numéro). Puis **« ↩ Renvoyer : Commande expédiée »** pour notifier le bon numéro.

> Le N° de suivi est **modifiable** à tout moment. La **référence** de commande (`LOCHT-…`) est permanente, jamais modifiable.

## 6. Communications client (renvois)

- **↩ Renvoyer confirmation** — la confirmation originale + instructions de paiement.
- **↩ Renvoyer : Paiement confirmé** / **: Commande expédiée**.
- **⚠ Email correction** — email d'excuse si un mail est parti par erreur (rappelle que le paiement n'est pas encore reçu).

## 7. La confirmation « clic-pour-armer »

Tout bouton à conséquence : **1er clic** → il devient **doré « Confirmer ? »**. **2e clic** → l'action s'exécute. Si tu ne re-cliques pas en ~4 s, il s'annule tout seul. (Pas de popup bloquante.)

## 8. Le reste de la fiche

- **Pièces** — photos des sacs commandés.
- **Infos client** — email, téléphone, adresse (bouton **Copier** pour l'étiquette d'envoi).
- **Ce qui l'a attiré** + **Note à glisser dans le colis** (bouton Copier — texte personnalisé généré à partir du message de la cliente).
- **Note interne** — privée, jamais envoyée au client.

---

## En cas de souci

- **« Échec email »** sur un bouton → vérifier les logs Vercel (Runtime Logs). Voir `CLAUDE.md` → *Bugs résolus & gotchas*.
- Un email reçu sans image → les `image_url` sont normalisés via `emailImg()` ; vérifier que la pièce a bien une image en inventaire.
