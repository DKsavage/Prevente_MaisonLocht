// Métadonnées des 3 modèles. Le statut/disponibilité vit dans la table `pieces` (DB).
export type ModelId = 'kouna' | 'kami' | 'nafibe'

export type PieceStatus = 'available' | 'reserved' | 'sold'

export type DbPiece = {
  id: string
  model: ModelId
  image_url: string
  status: PieceStatus
  sort_order: number
}

export const MODELS: {
  id: ModelId
  name: string
  format: { fr: string; en: string }
  price: number
  dims: string
}[] = [
  { id: 'kouna',  name: 'Le Kouna',  format: { fr: 'Le Petit',  en: 'The Small'  }, price: 285, dims: '35 × 21 × 15 cm' },
  { id: 'kami',   name: 'Le Kami',   format: { fr: 'Le Moyen',  en: 'The Medium' }, price: 328, dims: '45 × 25 × 22 cm' },
  { id: 'nafibe', name: 'Le Nafibe', format: { fr: 'Le Grand',  en: 'The Large'  }, price: 395, dims: '55 × 29 × 22 cm' },
]

export const getModel = (id: ModelId) => MODELS.find(m => m.id === id)!

// Numéro de pièce depuis l'id (kouna-03 → 3)
export const pieceNumFromId = (id: string): number => {
  const m = id.match(/-(\d+)$/)
  return m ? parseInt(m[1], 10) : 0
}

// Hook partagé : charge les pièces depuis l'API
export async function fetchPieces(): Promise<DbPiece[]> {
  const res = await fetch('/api/pieces', { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}
