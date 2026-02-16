import type { Node } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import type { ScaffoldNodeData } from './scaffoldGraph'

export const SCAFFOLD_STORAGE_KEY = 'scaffold-editor-state'

export interface StoredState {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
}

function isValidNode(n: unknown): n is Node<ScaffoldNodeData> {
  if (!n || typeof n !== 'object') return false
  const o = n as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    o.data != null &&
    typeof o.data === 'object' &&
    typeof (o.data as Record<string, unknown>).name === 'string' &&
    typeof (o.data as Record<string, unknown>).type === 'string' &&
    o.position != null &&
    typeof (o.position as { x: number, y: number }).x === 'number' &&
    typeof (o.position as { x: number, y: number }).y === 'number'
  )
}

function isValidEdge(e: unknown): e is Edge {
  if (!e || typeof e !== 'object') return false
  const o = e as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.source === 'string' && typeof o.target === 'string'
}

export function loadStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(SCAFFOLD_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    const nodes = Array.isArray(o.nodes) ? o.nodes.filter(isValidNode) : []
    const edges = Array.isArray(o.edges) ? o.edges.filter(isValidEdge) : []
    return { nodes, edges }
  } catch {
    return null
  }
}

export function saveStoredState(state: StoredState): void {
  try {
    localStorage.setItem(SCAFFOLD_STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function clearStoredState(): void {
  try {
    localStorage.removeItem(SCAFFOLD_STORAGE_KEY)
  } catch {
    return
  }
}
