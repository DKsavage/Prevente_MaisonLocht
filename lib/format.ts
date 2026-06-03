// Formatage de nombres en français canadien (séparateur de milliers : 4 738).
// Source unique — utilisée par le dashboard et les statistiques.
export function formatNumberFr(n: number): string {
  return n.toLocaleString('fr-CA', { maximumFractionDigits: 0 })
}
