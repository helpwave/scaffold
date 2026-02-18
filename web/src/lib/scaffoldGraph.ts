import type { ChipColor } from '@helpwave/hightide'
import type { Node, Edge } from '@xyflow/react'
import type { AttachedDataEntry, ScaffoldNodeType, TreeNode, UserMetadata } from '../types/scaffold'
import { ROOT_ORG_ID } from '../types/scaffold'

export function getParentByEdges(edges: Edge[]): Map<string, string> {
    const parentByChild = new Map<string, string>()
    for (const e of edges) {
        parentByChild.set(e.target, e.source)
    }
    return parentByChild
}

export function isNodeVisible(
    nodeId: string,
    collapsedIds: ReadonlySet<string>,
    parentByChild: Map<string, string>
): boolean {
    if (nodeId === ROOT_ORG_ID) return true
    const parent = parentByChild.get(nodeId)
    if (!parent) return true
    if (collapsedIds.has(parent)) return false
    return isNodeVisible(parent, collapsedIds, parentByChild)
}

export function getInitialCollapsedForImport(
    nodes: Node<ScaffoldNodeData>[],
    edges: Edge[]
): Set<string> {
    const rootDirectChildIds = new Set(edges.filter((e) => e.source === ROOT_ORG_ID).map((e) => e.target))
    const collapsed = new Set<string>()
    for (const n of nodes) {
        if (n.id !== ROOT_ORG_ID && !rootDirectChildIds.has(n.id)) {
            collapsed.add(n.id)
        }
    }
    return collapsed
}

const NODE_TYPE_TO_CHIP_COLOR: Record<ScaffoldNodeType, ChipColor> = {
    ORGANIZATION: 'primary',
    NETWORK: 'secondary',
    HOSPITAL: 'positive',
    PRACTICE: 'warning',
    CLINIC: 'negative',
    WARD: 'neutral',
    ROOM: 'primary',
    BED: 'secondary',
    TEAM: 'positive',
    USER: 'warning',
    ROLE: 'primary',
}

export function getChipColorForType(type: ScaffoldNodeType): ChipColor {
    return NODE_TYPE_TO_CHIP_COLOR[type]
}

export function getRootOrganizationNode(): Node<ScaffoldNodeData> {
    return {
        id: ROOT_ORG_ID,
        type: 'scaffold',
        position: { x: 0, y: 0 },
        data: { name: 'Your Organization', type: 'ORGANIZATION' },
        draggable: false,
    }
}

export interface ScaffoldNodeData extends Record<string, unknown> {
    name: string,
    type: ScaffoldNodeType,
    organization_ids?: string[],
    user_metadata?: UserMetadata,
    attached_data?: AttachedDataEntry[],
}

const HORIZONTAL_GAP = 220
const VERTICAL_GAP = 140

function layoutTree(
    node: TreeNode,
    x: number,
    y: number,
    nodes: Node<ScaffoldNodeData>[],
    edges: Edge[],
    idByPath: Map<string, string>,
    path: string
): { width: number, height: number } {
    const id = path === '0' && node.type === 'ORGANIZATION' ? ROOT_ORG_ID : `node-${path}`
    idByPath.set(path, id)
    const organizationIds = Array.isArray(node.organization_ids)
        ? node.organization_ids.filter((val): val is string => typeof val === 'string')
        : undefined
    const userMetadata = node.user_metadata && typeof node.user_metadata === 'object' ? node.user_metadata as UserMetadata : undefined
    const attachedData =
        Array.isArray(node.attached_data) &&
            node.attached_data.every((e) => e && typeof e.key === 'string' && typeof e.value === 'string')
            ? (node.attached_data as AttachedDataEntry[])
            : undefined
    const data: ScaffoldNodeData = {
        name: node.name,
        type: node.type,
        ...(organizationIds && organizationIds.length > 0 ? { organization_ids: organizationIds } : {}),
        ...(userMetadata ? { user_metadata: userMetadata } : {}),
        ...(attachedData && attachedData.length > 0 ? { attached_data: attachedData } : {}),
    }
    nodes.push({
        id,
        type: 'scaffold',
        position: { x, y },
        data,
        ...(id === ROOT_ORG_ID ? { draggable: false } : {}),
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
        const organizationIds = node.data.organization_ids
        const userMetadata = node.data.user_metadata
        const attachedData = node.data.attached_data
        const treeNode: TreeNode = {
            name: node.data.name,
            type: node.data.type,
            ...(organizationIds && organizationIds.length > 0 ? { organization_ids: organizationIds } : {}),
            ...(userMetadata ? { user_metadata: userMetadata } : {}),
            ...(attachedData && attachedData.length > 0 ? { attached_data: attachedData } : {}),
            children: childIds.length > 0 ? childIds.map(build) : undefined,
        }
        return treeNode
    }

    return roots.map((r) => build(r.id))
}

function treeNodeForExport(node: TreeNode): Record<string, unknown> {
    const out: Record<string, unknown> = {
        name: node.name,
        type: node.type,
    }
    if (node.organization_ids && node.organization_ids.length > 0) {
        out.organization_ids = node.organization_ids
    }
    if (node.user_metadata && Object.keys(node.user_metadata).length > 0) {
        out.user_metadata = node.user_metadata
    }
    if (node.attached_data && node.attached_data.length > 0) {
        out.attached_data = node.attached_data
    }
    if (node.children && node.children.length > 0) {
        out.children = node.children.map(treeNodeForExport)
    }
    return out
}

export function downloadAsJson(data: TreeNode | TreeNode[]): void {
    const serializable = Array.isArray(data) ? data.map(treeNodeForExport) : treeNodeForExport(data)
    const blob = new Blob([JSON.stringify(serializable, null, 2)], {
        type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scaffold.json'
    a.click()
    URL.revokeObjectURL(url)
}
