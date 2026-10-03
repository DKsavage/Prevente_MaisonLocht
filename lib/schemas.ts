import { z } from 'zod'
import { getModel, type ModelId } from './models'

// Une pièce unique sélectionnée
export const pieceSchema = z.object({
  id:        z.string(),
  model:     z.enum(['kouna', 'kami', 'nafibe', 'lucao-rouge', 'lucao-vert', 'lucao-marron', 'lucao-bleu']),
  modelName: z.string(),
  pieceNum:  z.number().int().positive(),
  price:     z.number().positive(),
  src:       z.string(),
})

// Max 2 pièces par catégorie (sacs, casquettes) — pas un max global
export const MAX_PER_CATEGORY = 2

export const orderBase = z.object({
  bagModel:   z.enum(['kouna', 'kami', 'nafibe', 'lucao-rouge', 'lucao-vert', 'lucao-marron', 'lucao-bleu']),
  bagName:    z.string(),
  quantity:   z.number().int().min(1).max(4),
  priceTotal: z.number().positive(),
  pieces:     z.array(pieceSchema).min(1).max(4),
  firstName:  z.string().min(2, 'Minimum 2 caractères').max(50),
  lastName:   z.string().min(2, 'Minimum 2 caractères').max(50),
  email:      z.string().email('Email invalide'),
  phone:      z.string().optional(),
  country:    z.string().min(2, 'Pays requis'),
  address:    z.string().min(3, 'Adresse requise'),
  city:       z.string().min(2, 'Ville requise'),
  province:   z.string().optional(),
  postalCode: z.string().min(2, 'Code postal requis').max(12),
  lang:       z.enum(['fr', 'en']),
  whyLocht:   z.string().max(500).optional(),
  headSize:   z.string().max(20).optional(), // tour de tête — casquettes uniquement
  website:    z.string().optional(), // honeypot — doit rester vide
})

export const orderSchema = orderBase.refine(data => {
  const perCategory: Record<string, number> = {}
  for (const p of data.pieces) {
    const cat = getModel(p.model as ModelId)?.category ?? 'bag'
    perCategory[cat] = (perCategory[cat] ?? 0) + 1
  }
  return Object.values(perCategory).every(n => n <= MAX_PER_CATEGORY)
}, { message: 'Maximum 2 pièces par catégorie (sacs / casquettes)', path: ['pieces'] })

export type OrderFormData = z.infer<typeof orderBase>
export type OrderPiece = z.infer<typeof pieceSchema>
