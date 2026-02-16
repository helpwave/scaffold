import { createContext, useContext } from 'react'

export interface NodeActionsContextValue {
  onEditNode: (id: string) => void,
  isRootOrgNode: (id: string) => boolean,
}

export const NodeActionsContext = createContext<NodeActionsContextValue | null>(null)

export function useNodeActions(): NodeActionsContextValue {
  const ctx = useContext(NodeActionsContext)
  if (!ctx) throw new Error('useNodeActions must be used within GraphEditor')
  return ctx
}
