// Source unique de vérité pour les statuts de commande.
// Importé par les server actions (validation) et les composants admin (affichage).
// Évite la duplication des libellés/couleurs entre OrdersTable, le dashboard, etc.

export const STATUSES = ['pending', 'payment_received', 'confirmed', 'shipped', 'cancelled'] as const
export type OrderStatus = typeof STATUSES[number]

// Tous les statuts — filtres et sélecteurs
export const ALL_STATUS: readonly OrderStatus[] = STATUSES

// Progression linéaire d'une commande (l'annulation est hors flux)
export const STATUS_FLOW: OrderStatus[] = ['pending', 'payment_received', 'confirmed', 'shipped']

// Libellé complet en français
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente', payment_received: 'Paiement reçu',
  confirmed: 'Confirmée', shipped: 'Expédiée', cancelled: 'Annulée',
}

// Libellé court — utilisé dans le stepper de progression
export const STATUS_SHORT: Record<OrderStatus, string> = {
  pending: 'Attente', payment_received: 'Payée',
  confirmed: 'Confirmée', shipped: 'Expédiée', cancelled: 'Annulée',
}

// Classes Tailwind du badge de statut
export const STATUS_PILL: Record<OrderStatus, string> = {
  pending:          'bg-[#b8965a]/12 text-[#9a7a3a] border-[#b8965a]/25',
  payment_received: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed:        'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped:          'bg-[#043672]/08 text-[#043672] border-[#043672]/20',
  cancelled:        'bg-red-50 text-red-500 border-red-200',
}

// Couleur de l'accent latéral (bordure gauche des lignes/cartes)
export const STATUS_LEFT_COLOR: Record<OrderStatus, string> = {
  pending: '#b8965a', payment_received: '#3b82f6',
  confirmed: '#10b981', shipped: '#043672', cancelled: '#ef4444',
}
