import { useCallback, useState } from 'react'
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
import { useTheme } from '@helpwave/hightide'
import '@xyflow/react/dist/style.css'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import { isScaffoldNodeType, SCAFFOLD_DRAG_TYPE } from '../types/scaffold'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import { ScaffoldNode } from './ScaffoldNode'
import { NamePopUp } from './NamePopUp'
import type { ScaffoldNodeType } from '../types/scaffold'

const nodeTypes = { scaffold: ScaffoldNode }


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
}

function GraphEditorInner({
  nodes,
  edges,
  setNodes,
  setEdges,
  treeError,
  setTreeError,
}: GraphEditorInnerProps) {
  const t = useScaffoldTranslation()
  const { screenToFlowPosition } = useReactFlow()
  const { resolvedTheme } = useTheme()
  const [namePopUpOpen, setNamePopUpOpen] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const isDark = resolvedTheme === 'dark'

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
      const targetId = target
      const hasIncoming = edges.some((e) => e.target === targetId)
      if (hasIncoming) {
        setTreeError(t('eachNodeOneParent'))
        return false
      }
      const targetNode = nodes.find((n) => n.id === targetId)
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

  return (
    <div
      className="w-full h-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => setNodes((nds) => applyNodeChanges<Node<ScaffoldNodeData>>(changes, nds))}
        onEdgesChange={(changes) => setEdges((eds) => applyEdgeChanges(changes, eds))}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes as NodeTypes}
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
      </ReactFlow>
      <NamePopUp
        isOpen={namePopUpOpen}
        onClose={() => {
          setPendingDrop(null)
          setNamePopUpOpen(false)
        }}
        onSubmit={handleNameSubmit}
        nodeType={pendingDrop?.type ?? 'HOSPITAL'}
      />
    </div>
  )
}

export interface GraphEditorProps {
  nodes: Node<ScaffoldNodeData>[],
  edges: Edge[],
  setNodes: (payload: Node<ScaffoldNodeData>[] | ((prev: Node<ScaffoldNodeData>[]) => Node<ScaffoldNodeData>[])) => void,
  setEdges: (payload: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  treeError: string | null,
  setTreeError: (msg: string | null) => void,
}

export function GraphEditor(props: GraphEditorProps) {
  return (
    <ReactFlowProvider>
      <GraphEditorInner {...props} />
    </ReactFlowProvider>
  )
}
