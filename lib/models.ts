// Métadonnées des modèles. Le statut/disponibilité vit dans la table `pieces` (DB).
export type ModelId =
  | 'kouna' | 'kami' | 'nafibe'
  | 'lucao-rouge' | 'lucao-vert' | 'lucao-marron' | 'lucao-bleu'

export type ModelCategory = 'bag' | 'cap'

export type PieceStatus = 'available' | 'reserved' | 'sold'

export type DbPiece = {
  id: string
  model: ModelId
  image_url: string
  image_url_2: string | null
  status: PieceStatus
  sort_order: number
  display_num: number | null
}

// Numéro affiché au client : display_num si défini, sinon dérivé de l'id
export const pieceNum = (p: { id: string; display_num?: number | null }): number =>
  p.display_num ?? pieceNumFromId(p.id)

export const MODELS: {
  id: ModelId
  name: string
  format: { fr: string; en: string }
  price: number
  dims: string
  category: ModelCategory
  // Casquettes : stock plafonné par couleur, regroupées visuellement sous `groupName`
  maxUnits?: number
  groupName?: string
  colorLabel?: { fr: string; en: string }
  colorSwatch?: string
}[] = [
  { id: 'kouna',  name: 'Le Kouna',  format: { fr: 'Le Petit',  en: 'The Small'  }, price: 285, dims: '35 × 21 × 15 cm', category: 'bag' },
  { id: 'kami',   name: 'Le Kami',   format: { fr: 'Le Moyen',  en: 'The Medium' }, price: 328, dims: '45 × 25 × 22 cm', category: 'bag' },
  { id: 'nafibe', name: 'Le Nafibe', format: { fr: 'Le Grand',  en: 'The Large'  }, price: 395, dims: '55 × 29 × 22 cm', category: 'bag' },

  {
    id: 'lucao-rouge', name: 'Lucao', format: { fr: 'Taille unique', en: 'One size' },
    price: 105, dims: 'Motif wax · ajustable', category: 'cap',
    maxUnits: 10, groupName: 'Lucao',
    colorLabel: { fr: 'Rouge', en: 'Red' }, colorSwatch: '#9c3b2e',
  },
  {
    id: 'lucao-vert', name: 'Lucao', format: { fr: 'Taille unique', en: 'One size' },
    price: 105, dims: 'Motif wax · ajustable', category: 'cap',
    maxUnits: 10, groupName: 'Lucao',
    colorLabel: { fr: 'Vert', en: 'Green' }, colorSwatch: '#4f5c42',
  },
  {
    id: 'lucao-marron', name: 'Lucao', format: { fr: 'Taille unique', en: 'One size' },
    price: 105, dims: 'Motif wax · ajustable', category: 'cap',
    maxUnits: 10, groupName: 'Lucao',
    colorLabel: { fr: 'Marron', en: 'Brown' }, colorSwatch: '#7a5a34',
  },
  {
    id: 'lucao-bleu', name: 'Lucao', format: { fr: 'Taille unique', en: 'One size' },
    price: 105, dims: 'Motif wax · ajustable', category: 'cap',
    maxUnits: 10, groupName: 'Lucao',
    colorLabel: { fr: 'Bleu', en: 'Blue' }, colorSwatch: '#2a3f63',
  },
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
