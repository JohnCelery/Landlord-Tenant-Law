import {
  createContext,
  type PropsWithChildren,
  type JSX,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { contentPackSchema, type ContentPack } from './schema'

type PackLoaderStatus = 'loading' | 'ready' | 'error'

interface PacksContextValue {
  packs: ContentPack[]
  activePackId: string | null
  activePack: ContentPack | null
  status: PackLoaderStatus
  error: string | null
  importPack: (url: string) => Promise<ContentPack>
  selectPack: (packId: string) => void
}

const PacksContext = createContext<PacksContextValue | null>(null)

const fetchPack = async (url: string): Promise<ContentPack> => {
  const response = await fetch(url, { cache: 'no-store' })

  if (!response.ok) {
    throw new Error(`Failed to fetch pack: ${response.status} ${response.statusText}`)
  }

  const raw = await response.json()
  const result = contentPackSchema.safeParse(raw)

  if (!result.success) {
    throw new Error(result.error.toString())
  }

  return result.data
}

export const PacksProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [packs, setPacks] = useState<ContentPack[]>([])
  const [activePackId, setActivePackId] = useState<string | null>(null)
  const [status, setStatus] = useState<PackLoaderStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const packsRef = useRef<ContentPack[]>([])

  const commitPacks = useCallback(
    (updater: ContentPack[] | ((current: ContentPack[]) => ContentPack[])) => {
      setPacks((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        packsRef.current = next
        return next
      })
    },
    [],
  )

  const handleInitialLoad = useCallback(async () => {
    setStatus('loading')
    setError(null)

    try {
      const pack = await fetchPack('/packs/core.pack.json')
      commitPacks([pack])
      setActivePackId(pack.id)
      setStatus('ready')
    } catch (cause) {
      console.error('Failed to load core content pack', cause)
      setError(cause instanceof Error ? cause.message : 'Unknown error loading pack')
      setStatus(packsRef.current.length > 0 ? 'ready' : 'error')
    }
  }, [commitPacks])

  useEffect(() => {
    handleInitialLoad()
  }, [handleInitialLoad])

  const importPack = useCallback(
    async (url: string) => {
      setStatus('loading')
      setError(null)

      try {
        const pack = await fetchPack(url)
        commitPacks((current) => {
          const others = current.filter((candidate) => candidate.id !== pack.id)
          return [...others, pack]
        })
        setActivePackId(pack.id)
        setStatus('ready')
        return pack
      } catch (cause) {
        console.error('Failed to import pack', cause)
        setError(cause instanceof Error ? cause.message : 'Unknown error importing pack')
        setStatus(packsRef.current.length > 0 ? 'ready' : 'error')
        throw cause
      }
    },
    [commitPacks],
  )

  const selectPack = useCallback((packId: string) => {
    setActivePackId(packId)
  }, [])

  const value = useMemo<PacksContextValue>(() => {
    const activePack = packs.find((pack) => pack.id === activePackId) ?? null

    return {
      packs,
      activePackId,
      activePack,
      status,
      error,
      importPack,
      selectPack,
    }
  }, [packs, activePackId, status, error, importPack, selectPack])

  return <PacksContext.Provider value={value}>{children}</PacksContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePacks = (): PacksContextValue => {
  const context = useContext(PacksContext)

  if (!context) {
    throw new Error('usePacks must be used within a PacksProvider')
  }

  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export const useActivePack = (): ContentPack => {
  const { activePack } = usePacks()

  if (!activePack) {
    throw new Error('Active content pack is not available yet')
  }

  return activePack
}
