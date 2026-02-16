import type { Node } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import type { ScaffoldNodeData } from './scaffoldGraph'
import type { ScaffoldEdgeData } from '../types/scaffold'
import { SCAFFOLD_CONNECTION_TYPES } from '../types/scaffold'

export const SCAFFOLD_STORAGE_KEY = 'scaffold-editor-state'

export interface StoredState {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge<ScaffoldEdgeData>[],
}

function isValidOrganizationIds(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item): item is string => typeof item === 'string')
}

function isValidUserMetadata(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  const str = (x: unknown): x is string => typeof x === 'string'
  if (o.email !== undefined && !str(o.email)) return false
  if (o.firstname !== undefined && !str(o.firstname)) return false
  if (o.lastname !== undefined && !str(o.lastname)) return false
  if (o.role !== undefined && !['viewer', 'moderator', 'admin'].includes(o.role as string)) return false
  if (o.location !== undefined) {
    if (!o.location || typeof o.location !== 'object') return false
    const loc = o.location as Record<string, unknown>
    if (loc.street !== undefined && !str(loc.street)) return false
    if (loc.city !== undefined && !str(loc.city)) return false
    if (loc.country !== undefined && !str(loc.country)) return false
  }
  return true
}

function isValidNode(n: unknown): n is Node<ScaffoldNodeData> {
  if (!n || typeof n !== 'object') return false
  const o = n as Record<string, unknown>
  const data = o.data as Record<string, unknown> | null
  if (!data || typeof data !== 'object') return false
  const orgIds = data.organization_ids
  if (orgIds !== undefined && !isValidOrganizationIds(orgIds)) return false
  if (data.user_metadata !== undefined && !isValidUserMetadata(data.user_metadata)) return false
  if (data.attached_data !== undefined) {
    if (!Array.isArray(data.attached_data)) return false
    if (!data.attached_data.every((e: unknown) => e && typeof e === 'object' && typeof (e as { key?: unknown }).key === 'string' && typeof (e as { value?: unknown }).value === 'string')) return false
  }
  return (
    typeof o.id === 'string' &&
    typeof o.type === 'string' &&
    typeof data.name === 'string' &&
    typeof data.type === 'string' &&
    o.position != null &&
    typeof (o.position as { x: number, y: number }).x === 'number' &&
    typeof (o.position as { x: number, y: number }).y === 'number'
  )
}

const VALID_USER_ROLES = ['viewer', 'moderator', 'admin'] as const

function isValidEdgeData(data: unknown): data is ScaffoldEdgeData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (d.connectionType !== undefined) {
    if (!SCAFFOLD_CONNECTION_TYPES.includes(d.connectionType as never)) return false
  }
  if (d.role !== undefined && !VALID_USER_ROLES.includes(d.role as never)) return false
  if (d.attributes !== undefined) {
    if (!Array.isArray(d.attributes)) return false
    if (!d.attributes.every((e: unknown) => e && typeof e === 'object' && typeof (e as { key?: unknown }).key === 'string' && typeof (e as { value?: unknown }).value === 'string')) return false
  }
  return true
}

function isValidEdge(e: unknown): e is Edge<ScaffoldEdgeData> {
  if (!e || typeof e !== 'object') return false
  const o = e as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.source !== 'string' || typeof o.target !== 'string') return false
  if (o.data !== undefined && !isValidEdgeData(o.data)) return false
  return true
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
