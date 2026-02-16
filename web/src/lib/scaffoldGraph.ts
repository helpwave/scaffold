import type { ChipColor } from '@helpwave/hightide'
import type { Node, Edge } from '@xyflow/react'
import type { ScaffoldNodeType, TreeNode } from '../types/scaffold'

const NODE_TYPE_TO_CHIP_COLOR: Record<ScaffoldNodeType, ChipColor> = {
  HOSPITAL: 'primary',
  PRACTICE: 'secondary',
  CLINIC: 'secondary',
  WARD: 'positive',
  ROOM: 'warning',
  BED: 'negative',
  TEAM: 'neutral',
  USER: 'neutral',
}

export function getChipColorForType(type: ScaffoldNodeType): ChipColor {
  return NODE_TYPE_TO_CHIP_COLOR[type]
}

export interface ScaffoldNodeData extends Record<string, unknown> {
  name: string,
  type: ScaffoldNodeType,
}

const HORIZONTAL_GAP = 220
const VERTICAL_GAP = 80

function layoutTree(
  node: TreeNode,
  x: number,
  y: number,
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
  idByPath: Map<string, string>,
  path: string
): { width: number, height: number } {
  const id = `node-${path}`
  idByPath.set(path, id)
  nodes.push({
    id,
    type: 'scaffold',
    position: { x, y },
    data: { name: node.name, type: node.type },
  })

  if (!node.children || node.children.length === 0) {
    return { width: 180, height: 56 }
  }

  let totalWidth = 0
  let maxHeight = 0
  const childStarts: { x: number, y: number, w: number, h: number }[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    const childPath = `${path}-${i}`
    const { width: cw, height: ch } = layoutTree(
      child,
      x + totalWidth,
      y + VERTICAL_GAP,
      nodes,
      edges,
      idByPath,
      childPath
    )
    edges.push({ id: `e-${id}-${idByPath.get(childPath)!}`, source: id, target: idByPath.get(childPath)! })
    childStarts.push({ x: x + totalWidth, y: y + VERTICAL_GAP, w: cw, h: ch })
    totalWidth += cw + HORIZONTAL_GAP
    maxHeight = Math.max(maxHeight, ch)
  }

  totalWidth = Math.max(totalWidth - HORIZONTAL_GAP, 180)
  const blockHeight = VERTICAL_GAP + maxHeight
  return { width: totalWidth, height: blockHeight }
}

export function treeToFlow(tree: TreeNode | TreeNode[]): {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
} {
  const roots = Array.isArray(tree) ? tree : [tree]
  const nodes: Node<ScaffoldNodeData>[] = []
  const edges: Edge[] = []
  const idByPath = new Map<string, string>()
  let x = 0
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i]
    const path = `${i}`
    const { width } = layoutTree(root, x, 0, nodes, edges, idByPath, path)
    x += width + HORIZONTAL_GAP
  }
  return { nodes, edges }
}

export function flowToTree(
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[]
): TreeNode[] {
  const childrenBySource = new Map<string, string[]>()
  const nodeById = new Map<string, Node<ScaffoldNodeData>>()
  const inDegree = new Map<string, number>()

  for (const n of nodes) {
    nodeById.set(n.id, n)
    inDegree.set(n.id, 0)
  }
  for (const e of edges) {
    const list = childrenBySource.get(e.source) ?? []
    list.push(e.target)
    childrenBySource.set(e.source, list)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }

  const roots = nodes.filter((n) => inDegree.get(n.id) === 0)

  function build(nodeId: string): TreeNode {
    const node = nodeById.get(nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)
    const childIds = childrenBySource.get(nodeId) ?? []
    return {
      name: node.data.name,
      type: node.data.type,
      children: childIds.length > 0 ? childIds.map(build) : undefined,
    }
  }

  return roots.map((r) => build(r.id))
}

export function downloadAsJson(data: TreeNode | TreeNode[]): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'scaffold.json'
  a.click()
  URL.revokeObjectURL(url)
}
