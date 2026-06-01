import { z } from 'zod'

export const orderSchema = z.object({
  bagModel:   z.enum(['kouna', 'kami', 'nafibe']),
  bagName:    z.string(),
  quantity:   z.number().int().min(1).max(2),
  priceTotal: z.number().positive(),
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
})

export type OrderFormData = z.infer<typeof orderSchema>
