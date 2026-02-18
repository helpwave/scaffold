import { createContext, useContext } from 'react'

export interface NodeActionsContextValue {
  onEditNode: (id: string) => void,
  onRequestDeleteNode: (id: string) => void,
  isRootOrgNode: (id: string) => boolean,
  getChildCount: (id: string) => number,
  isCollapsed: (id: string) => boolean,
  onExpand: (id: string) => void,
  onCollapse: (id: string) => void,
}

export const NodeActionsContext = createContext<NodeActionsContextValue | null>(null)

export function useNodeActions(): NodeActionsContextValue {
  const ctx = useContext(NodeActionsContext)
  if (!ctx) throw new Error('useNodeActions must be used within GraphEditor')
  return ctx
}
