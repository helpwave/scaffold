import { useState, useEffect, useRef, useCallback } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import { HelpwaveLogo, LanguageDialog, ThemeDialog } from '@helpwave/hightide'
import { useScaffoldTranslation } from './i18n/ScaffoldTranslationContext'
import { GraphEditor } from './components/GraphEditor'
import { Sidebar } from './components/Sidebar'
import type { ScaffoldNodeData } from './lib/scaffoldGraph'
import { flowToTree, downloadAsJson, getRootOrganizationNode } from './lib/scaffoldGraph'
import { loadStoredState, saveStoredState, clearStoredState } from './lib/storage'
import { ROOT_ORG_ID } from './types/scaffold'

const SAVE_DEBOUNCE_MS = 300

function ensureRootOrgInNodes(nodes: Node<ScaffoldNodeData>[]): Node<ScaffoldNodeData>[] {
  const hasRoot = nodes.some((n) => n.id === ROOT_ORG_ID)
  if (hasRoot) {
    return nodes.map((n) => (n.id === ROOT_ORG_ID ? { ...n, draggable: false } : n))
  }
  const firstOrg = nodes.find((n) => n.data?.type === 'ORGANIZATION')
  if (firstOrg) {
    const oldId = firstOrg.id
    return nodes.map((n) =>
      n.id === oldId ? { ...getRootOrganizationNode(), position: n.position, data: { ...n.data } } : n)
  }
  return [getRootOrganizationNode(), ...nodes]
}

function ensureRootOrgInEdges(edges: Edge[], nodes: Node<ScaffoldNodeData>[]): Edge[] {
  const hasRoot = nodes.some((n) => n.id === ROOT_ORG_ID)
  if (hasRoot) return edges
  const firstOrg = nodes.find((n) => n.data?.type === 'ORGANIZATION')
  if (!firstOrg) return edges
  const oldId = firstOrg.id
  return edges.map((e) => ({
    ...e,
    source: e.source === oldId ? ROOT_ORG_ID : e.source,
    target: e.target === oldId ? ROOT_ORG_ID : e.target,
  }))
}

function App() {
  const t = useScaffoldTranslation()
  const [nodes, setNodes] = useNodesState<Node<ScaffoldNodeData>>([getRootOrganizationNode()])
  const [edges, setEdges] = useEdgesState<Edge>([])
  const [treeError, setTreeError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [themeDialogOpen, setThemeDialogOpen] = useState(false)
  const [localeDialogOpen, setLocaleDialogOpen] = useState(false)
  const initDone = useRef(false)
  const fitViewRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    document.title = t('pageTitle')
  }, [t])

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    const stored = loadStoredState()
    if (stored && (stored.nodes.length > 0 || stored.edges.length > 0)) {
      const normalizedNodes = ensureRootOrgInNodes(stored.nodes)
      const normalizedEdges = ensureRootOrgInEdges(stored.edges, stored.nodes)
      setNodes(normalizedNodes)
      setEdges(normalizedEdges)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    const t = setTimeout(() => {
      saveStoredState({ nodes, edges })
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [nodes, edges])

  const handleExport = () => {
    const tree = flowToTree(nodes, edges)
    if (tree.length === 0) return
    downloadAsJson(tree.length === 1 ? tree[0] : tree)
  }

  const handleImport = useCallback(
    (newNodes: Node<ScaffoldNodeData>[], newEdges: Edge[]) => {
      const normalizedNodes = ensureRootOrgInNodes(newNodes)
      const normalizedEdges = ensureRootOrgInEdges(newEdges, newNodes)
      setNodes(normalizedNodes)
      setEdges(normalizedEdges)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => fitViewRef.current?.())
      })
    },
    [setNodes, setEdges]
  )

  const handleClear = () => {
    setNodes(() => [getRootOrganizationNode()])
    setEdges([])
    setTreeError(null)
    setImportError(null)
    clearStoredState()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => fitViewRef.current?.())
    })
  }

  const hasRootOrg = nodes.some((n) => n.id === ROOT_ORG_ID)

  return (
    <>
      <div className="flex md:hidden flex-col items-center justify-center gap-8 h-screen w-screen bg-background text-on-background p-6">
        <HelpwaveLogo
          animate="loading"
          color="currentColor"
          height={128}
          width={128}
        />
        <p className="text-center text-lg font-medium">
          {t('onlyOnDesktop')}
        </p>
      </div>
      <div className="hidden md:flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <ThemeDialog
          isOpen={themeDialogOpen}
          onClose={() => setThemeDialogOpen(false)}
        />
        <LanguageDialog
          isOpen={localeDialogOpen}
          onClose={() => setLocaleDialogOpen(false)}
        />
        <div className="relative flex-1 min-h-0 min-w-0">
          <main className="absolute inset-0">
            <GraphEditor
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              treeError={treeError}
              setTreeError={setTreeError}
              fitViewRef={fitViewRef}
              onOpenThemeDialog={() => setThemeDialogOpen(true)}
              onOpenLocaleDialog={() => setLocaleDialogOpen(true)}
            />
          </main>
          <div className="absolute left-0 top-0 bottom-0 z-10 flex items-stretch">
            <Sidebar
              onExport={handleExport}
              onImport={handleImport}
              onClear={handleClear}
              importError={importError}
              setImportError={setImportError}
              hasRootOrg={hasRootOrg}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default App
