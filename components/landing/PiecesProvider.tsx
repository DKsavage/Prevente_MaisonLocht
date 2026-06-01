'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchPieces, type DbPiece } from '@/lib/models'

type PiecesCtx = { pieces: DbPiece[]; availableCount: number; loaded: boolean }
const Ctx = createContext<PiecesCtx>({ pieces: [], availableCount: 0, loaded: false })
export const usePieces = () => useContext(Ctx)

// Source partagée de l'inventaire — rafraîchie automatiquement (live).
// Poll toutes les 45s + au retour sur l'onglet → le stock baisse en direct.
export function PiecesProvider({ children }: { children: React.ReactNode }) {
  const [pieces, setPieces] = useState<DbPiece[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchPieces()
    if (data.length) { setPieces(data); setLoaded(true) }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 45000)
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onFocus)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onFocus) }
  }, [load])

  const availableCount = pieces.filter(p => p.status === 'available').length

  return <Ctx.Provider value={{ pieces, availableCount, loaded }}>{children}</Ctx.Provider>
}
