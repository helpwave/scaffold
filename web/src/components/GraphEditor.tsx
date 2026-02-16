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
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import { ScaffoldNode } from './ScaffoldNode'
import { NamePopUp } from './NamePopUp'
import { NodeSettingsDialog } from './NodeSettingsDialog'
import { NodeActionsContext } from './NodeActionsContext'
import type { NodeActionsContextValue } from './NodeActionsContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeSwitcher } from './ThemeSwitcher'
import type { ScaffoldNodeType } from '../types/scaffold'

interface PendingDrop {
  position: { x: number, y: number },
  type: ScaffoldNodeType,
}

interface GraphEditorInnerProps {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
  setNodes: (payload: Node<ScaffoldNodeData>[] | ((prev: Node<ScaffoldNodeData>[]) => Node<ScaffoldNodeData>[])) => void,
  setEdges: (payload: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  treeError: string | null,
  setTreeError: (msg: string | null) => void,
  fitViewRef?: MutableRefObject<(() => void) | null>,
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
  onOpenThemeDialog,
  onOpenLocaleDialog,
}: GraphEditorInnerProps) {
  const t = useScaffoldTranslation()
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow()

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
  const [deleteConfirmNodeId, setDeleteConfirmNodeId] = useState<string | null>(null)
  const isDark = resolvedTheme === 'dark'

  const settingsNode = settingsNodeId ? nodes.find((n) => n.id === settingsNodeId) : null

  const nodeTypes = useMemo<NodeTypes>(() => ({ scaffold: ScaffoldNode }), [])

  const nodeActionsValue: NodeActionsContextValue = {
    onEditNode: setSettingsNodeId,
    onRequestDeleteNode: setDeleteConfirmNodeId,
    isRootOrgNode: (id) => id === ROOT_ORG_ID,
  }

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmNodeId) return
    setNodes((nds) => nds.filter((n) => n.id !== deleteConfirmNodeId))
    setEdges((eds) =>
      eds.filter((e) => e.source !== deleteConfirmNodeId && e.target !== deleteConfirmNodeId))
    setDeleteConfirmNodeId(null)
  }, [deleteConfirmNodeId, setNodes, setEdges])

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
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges, setTreeError]
  )

  const nodesWithRootLocked = useMemo(
    () =>
      nodes.map((n) =>
        n.id === ROOT_ORG_ID ? { ...n, draggable: false } : n),
    [nodes]
  )

  const roleStroke = (role: string | undefined): string | undefined => {
    if (role === 'admin') return '#ef4444'
    if (role === 'moderator') return '#f97316'
    if (role === 'viewer') return '#3b82f6'
    return undefined
  }

  const edgesWithRoleStyle = useMemo(() => {
    return edges.map((e) => {
      const sourceNode = nodes.find((n) => n.id === e.source)
      const targetNode = nodes.find((n) => n.id === e.target)
      const sourceData = sourceNode?.data as ScaffoldNodeData | undefined
      const targetData = targetNode?.data as ScaffoldNodeData | undefined
      const role = sourceData?.user_metadata?.role ?? targetData?.user_metadata?.role
      const stroke = roleStroke(role)
      return {
        ...e,
        style: { ...e.style, strokeWidth: 2.5, ...(stroke ? { stroke } : {}) },
      }
    })
  }, [edges, nodes])

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
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{ style: { strokeWidth: 2.5 } }}
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
        />
        <ConfirmDialog
          isOpen={deleteConfirmNodeId !== null}
          titleElement={t('deleteNodeTitle')}
          description={t('deleteNodeDescription')}
          confirmType="negative"
          onCancel={() => setDeleteConfirmNodeId(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </NodeActionsContext.Provider>
  )
}

export interface GraphEditorProps {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
  setNodes: (payload: Node<ScaffoldNodeData>[] | ((prev: Node<ScaffoldNodeData>[]) => Node<ScaffoldNodeData>[])) => void,
  setEdges: (payload: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  treeError: string | null,
  setTreeError: (msg: string | null) => void,
  fitViewRef?: MutableRefObject<(() => void) | null>,
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
