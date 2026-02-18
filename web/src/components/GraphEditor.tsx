import type { MutableRefObject } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Edge,
  getOutgoers,
  type Node,
  type NodeTypes,
  ReactFlow,
  useReactFlow,
  type Connection,
  ReactFlowProvider,
  Panel
} from '@xyflow/react'
import { ConfirmDialog, IconButton, useTheme } from '@helpwave/hightide'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import type { ScaffoldTranslationEntries } from '../i18n/translations'
import { isScaffoldNodeType, ROOT_ORG_ID, SCAFFOLD_DRAG_TYPE } from '../types/scaffold'
import type { ScaffoldEdgeData } from '../types/scaffold'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import { getParentByEdges, isNodeVisible } from '../lib/scaffoldGraph'
import { ScaffoldNode } from './ScaffoldNode'
import { NamePopUp } from './NamePopUp'
import { NodeSettingsDialog } from './NodeSettingsDialog'
import { ConnectionSettingsDialog } from './ConnectionSettingsDialog'
import { NodeActionsContext } from './NodeActionsContext'
import type { NodeActionsContextValue } from './NodeActionsContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import type { ScaffoldNodeType } from '../types/scaffold'

export type ScaffoldEdge = Edge<ScaffoldEdgeData>

interface PendingDrop {
  position: { x: number, y: number },
  type: ScaffoldNodeType,
}

interface GraphEditorInnerProps {
  nodes: Node<ScaffoldNodeData>[],
  edges: ScaffoldEdge[],
  setNodes: (payload: Node<ScaffoldNodeData>[] | ((prev: Node<ScaffoldNodeData>[]) => Node<ScaffoldNodeData>[])) => void,
  setEdges: (payload: ScaffoldEdge[] | ((prev: ScaffoldEdge[]) => ScaffoldEdge[])) => void,
  treeError: string | null,
  setTreeError: (msg: string | null) => void,
  fitViewRef?: MutableRefObject<(() => void) | null>,
  collapsedNodeIds: ReadonlySet<string>,
  setCollapsedNodeIds: (payload: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  onOpenThemeDialog?: () => void,
  onOpenLocaleDialog?: () => void,
}

function GraphEditorInner({
  nodes,
  edges,
  setNodes,
  setEdges,
  treeError,
  setTreeError,
  fitViewRef,
  collapsedNodeIds,
  setCollapsedNodeIds,
  onOpenThemeDialog,
  onOpenLocaleDialog,
}: GraphEditorInnerProps) {
  const t = useScaffoldTranslation()
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow()

  const parentByChild = useMemo(() => getParentByEdges(edges), [edges])
  const visibleIdSet = useMemo(() => {
    const set = new Set<string>()
    for (const n of nodes) {
      if (isNodeVisible(n.id, collapsedNodeIds, parentByChild)) set.add(n.id)
    }
    return set
  }, [nodes, collapsedNodeIds, parentByChild])
  const visibleNodes = useMemo(
    () => nodes.filter((n) => visibleIdSet.has(n.id)),
    [nodes, visibleIdSet]
  )
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleIdSet.has(e.source) && visibleIdSet.has(e.target)),
    [edges, visibleIdSet]
  )
  const childCountByNode = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of edges) {
      map.set(e.source, (map.get(e.source) ?? 0) + 1)
    }
    return map
  }, [edges])

  useEffect(() => {
    if (fitViewRef) {
      fitViewRef.current = () => fitView({ padding: 0.2, duration: 200 })
    }
    return () => {
      if (fitViewRef) fitViewRef.current = null
    }
  }, [fitViewRef, fitView])
  const { resolvedTheme } = useTheme()
  const [namePopUpOpen, setNamePopUpOpen] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const [settingsNodeId, setSettingsNodeId] = useState<string | null>(null)
  const [settingsEdgeId, setSettingsEdgeId] = useState<string | null>(null)
  const [deleteConfirmNodeId, setDeleteConfirmNodeId] = useState<string | null>(null)
  const isDark = resolvedTheme === 'dark'

  const settingsEdge = settingsEdgeId ? edges.find((e) => e.id === settingsEdgeId) : null
  const settingsEdgeSource = settingsEdge ? nodes.find((n) => n.id === settingsEdge.source) : null
  const settingsEdgeTarget = settingsEdge ? nodes.find((n) => n.id === settingsEdge.target) : null
  const settingsEdgeSourceLabel = (settingsEdgeSource?.data as ScaffoldNodeData | undefined)?.name ?? settingsEdge?.source ?? ''
  const settingsEdgeTargetLabel = (settingsEdgeTarget?.data as ScaffoldNodeData | undefined)?.name ?? settingsEdge?.target ?? ''
  const settingsEdgeSourceType = (settingsEdgeSource?.data as ScaffoldNodeData | undefined)?.type
  const settingsEdgeTargetType = (settingsEdgeTarget?.data as ScaffoldNodeData | undefined)?.type

  const settingsNode = settingsNodeId ? nodes.find((n) => n.id === settingsNodeId) : null

  const nodeTypes = useMemo<NodeTypes>(() => ({ scaffold: ScaffoldNode }), [])

  const nodeActionsValue: NodeActionsContextValue = useMemo(
    () => ({
      onEditNode: setSettingsNodeId,
      onRequestDeleteNode: setDeleteConfirmNodeId,
      isRootOrgNode: (id) => id === ROOT_ORG_ID,
      getChildCount: (id) => childCountByNode.get(id) ?? 0,
      isCollapsed: (id) => collapsedNodeIds.has(id),
      onExpand: (id) =>
        setCollapsedNodeIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        }),
      onCollapse: (id) =>
        setCollapsedNodeIds((prev) => new Set(prev).add(id)),
    }),
    [childCountByNode, collapsedNodeIds, setCollapsedNodeIds]
  )

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      setSettingsNodeId(null)
    },
    [setNodes, setEdges]
  )

  const handleNodeSettingsSave = useCallback(
    (nodeId: string, data: Partial<ScaffoldNodeData>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n))
    },
    [setNodes]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData(SCAFFOLD_DRAG_TYPE)
      if (!raw || !isScaffoldNodeType(raw)) return
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      setPendingDrop({ position, type: raw })
      setNamePopUpOpen(true)
    },
    [screenToFlowPosition]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleNameSubmit = useCallback(
    (name: string) => {
      if (!pendingDrop) return
      const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setNodes((nds) =>
        nds.concat({
          id,
          type: 'scaffold',
          position: pendingDrop.position,
          data: { name, type: pendingDrop.type },
        }))
      setPendingDrop(null)
      setNamePopUpOpen(false)
    },
    [pendingDrop, setNodes]
  )

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const source = 'source' in connection ? connection.source : ''
      const target = 'target' in connection ? connection.target : ''
      if (source === target) return false
      const sourceNode = nodes.find((n) => n.id === source)
      const targetNode = nodes.find((n) => n.id === target)
      if (sourceNode?.data?.type === 'USER') return false
      if (targetNode?.data?.type === 'ORGANIZATION') return false
      const targetId = target
      const hasIncoming = edges.some((e) => e.target === targetId)
      if (hasIncoming) {
        setTreeError(t('eachNodeOneParent'))
        return false
      }
      if (!targetNode) return false
      const visited = new Set<string>()
      const hasCycle = (node: Node<ScaffoldNodeData>): boolean => {
        if (node.id === source) return true
        if (visited.has(node.id)) return false
        visited.add(node.id)
        const outgoers = getOutgoers(node, nodes as Node[], edges)
        return outgoers.some((o) => hasCycle(o as Node<ScaffoldNodeData>))
      }
      if (hasCycle(targetNode)) {
        setTreeError(t('connectionWouldCreateCycle'))
        return false
      }
      setTreeError(null)
      return true
    },
    [edges, nodes, setTreeError, t]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setTreeError(null)
      setEdges((eds) => addEdge({ ...params, data: {} }, eds))
    },
    [setEdges, setTreeError]
  )

  const removeSelectedEdges = useCallback(() => {
    setEdges((eds) => eds.filter((e) => !e.selected))
  }, [setEdges])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('input') != null || target.closest('textarea') != null || target.closest('[role="dialog"]') != null) {
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const hasSelectedEdges = edges.some((e) => e.selected)
        if (hasSelectedEdges) {
          event.preventDefault()
          removeSelectedEdges()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [edges, removeSelectedEdges])

  const handleConnectionSettingsSave = useCallback(
    (edgeId: string, data: ScaffoldEdgeData) => {
      setEdges((eds) =>
        eds.map((e) => (e.id === edgeId ? { ...e, data, selected: false } : e)))
      setSettingsEdgeId(null)
    },
    [setEdges]
  )

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId))
      setSettingsEdgeId(null)
    },
    [setEdges]
  )

  const nodesWithRootLocked = useMemo(
    () =>
      visibleNodes.map((n) =>
        n.id === ROOT_ORG_ID ? { ...n, draggable: false } : n),
    [visibleNodes]
  )

  const PRIMARY_STROKE = '#6366f1'
  const roleStroke = (role: string | undefined): string | undefined => {
    if (role === 'admin') return '#ef4444'
    if (role === 'moderator') return '#f97316'
    if (role === 'viewer') return '#22c55e'
    return undefined
  }

  const edgesWithRoleStyle = useMemo(() => {
    return visibleEdges.map((e: ScaffoldEdge) => {
      const role = e.data?.role
      const stroke = e.selected ? PRIMARY_STROKE : roleStroke(role)
      return {
        ...e,
        style: {
          ...e.style,
          strokeWidth: 2.5,
          ...(stroke != null ? { stroke } : {}),
        },
      }
    })
  }, [visibleEdges])

  return (
    <NodeActionsContext.Provider value={nodeActionsValue}>
      <div
        className="w-full h-full"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodesWithRootLocked}
          edges={edgesWithRoleStyle}
          onNodesChange={(changes) => setNodes((nds) => applyNodeChanges<Node<ScaffoldNodeData>>(changes, nds))}
          onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
          onConnect={onConnect}
          onNodeDoubleClick={(_event, node) => setSettingsNodeId(node.id)}
          onEdgeDoubleClick={(_event, edge) => setSettingsEdgeId(edge.id)}
          elementsSelectable
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ style: { strokeWidth: 2.5 }, data: {} }}
          proOptions={{ hideAttribution: true }}
          fitView
          className={isDark ? 'bg-gray-900 dark' : 'bg-gray-100'}
        >
        <Background />
        {treeError && (
          <Panel position="top-center" className={isDark ? 'bg-red-800 text-white px-3 py-2 rounded text-sm shadow' : 'bg-red-600 text-white px-3 py-2 rounded text-sm shadow'}>
            {treeError}
          </Panel>
        )}
        <Panel position="top-right" className="flex items-center gap-1">
          <IconButton onClick={() => fitView({ padding: 0.2, duration: 200 })} aria-label={t('centerView')} title={t('centerView')}>
            <Maximize2 className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => zoomOut()} aria-label={t('zoomOut')} title={t('zoomOut')}>
            <ZoomOut className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => zoomIn()} aria-label={t('zoomIn')} title={t('zoomIn')}>
            <ZoomIn className="w-4 h-4" />
          </IconButton>
          {onOpenThemeDialog && (
            <ThemeSwitcher onOpen={onOpenThemeDialog} />
          )}
          {onOpenLocaleDialog && (
            <LanguageSwitcher onOpen={onOpenLocaleDialog} />
          )}
        </Panel>
        </ReactFlow>
        <NamePopUp
          isOpen={namePopUpOpen}
          onClose={() => {
            setPendingDrop(null)
            setNamePopUpOpen(false)
          }}
          onSubmit={handleNameSubmit}
          typeLabel={pendingDrop ? t(`nodeType_${pendingDrop.type}` as keyof ScaffoldTranslationEntries) : ''}
        />
        <NodeSettingsDialog
          isOpen={settingsNodeId !== null}
          nodeId={settingsNodeId}
          nodeData={settingsNode?.data ?? null}
          onClose={() => setSettingsNodeId(null)}
          onSave={handleNodeSettingsSave}
          onDelete={handleDeleteNode}
          isRootOrgNode={settingsNodeId === ROOT_ORG_ID}
        />
        <ConnectionSettingsDialog
          isOpen={settingsEdgeId !== null}
          edgeId={settingsEdgeId}
          edgeData={settingsEdge?.data ?? null}
          sourceLabel={settingsEdgeSourceLabel}
          targetLabel={settingsEdgeTargetLabel}
          sourceType={settingsEdgeSourceType}
          targetType={settingsEdgeTargetType}
          onClose={() => setSettingsEdgeId(null)}
          onSave={handleConnectionSettingsSave}
          onDelete={handleDeleteEdge}
        />
        <ConfirmDialog
          isOpen={deleteConfirmNodeId !== null}
          onConfirm={() => {
            if (deleteConfirmNodeId) {
              handleDeleteNode(deleteConfirmNodeId)
              setDeleteConfirmNodeId(null)
            }
          }}
          onCancel={() => setDeleteConfirmNodeId(null)}
          titleElement={t('deleteNodeTitle')}
          description={t('deleteNodeDescription')}
          confirmType="negative"
        />
      </div>
    </NodeActionsContext.Provider>
  )
}

export interface GraphEditorProps {
  nodes: Node<ScaffoldNodeData>[],
  edges: ScaffoldEdge[],
  setNodes: (payload: Node<ScaffoldNodeData>[] | ((prev: Node<ScaffoldNodeData>[]) => Node<ScaffoldNodeData>[])) => void,
  setEdges: (payload: ScaffoldEdge[] | ((prev: ScaffoldEdge[]) => ScaffoldEdge[])) => void,
  treeError: string | null,
  setTreeError: (msg: string | null) => void,
  fitViewRef?: MutableRefObject<(() => void) | null>,
  collapsedNodeIds: ReadonlySet<string>,
  setCollapsedNodeIds: (payload: Set<string> | ((prev: Set<string>) => Set<string>)) => void,
  onOpenThemeDialog?: () => void,
  onOpenLocaleDialog?: () => void,
}

export function GraphEditor(props: GraphEditorProps) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner {...props} />
    </ReactFlowProvider>
  )
}
