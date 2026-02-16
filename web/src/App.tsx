import { useState, useEffect, useRef } from 'react'
import { useNodesState, useEdgesState } from '@xyflow/react'
import type { Node } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import { DialogRoot, HelpwaveLogo, LanguageDialog, ThemeDialog } from '@helpwave/hightide'
import { useScaffoldTranslation } from './i18n/ScaffoldTranslationContext'
import { GraphEditor } from './components/GraphEditor'
import { Sidebar } from './components/Sidebar'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import type { ScaffoldNodeData } from './lib/scaffoldGraph'
import { flowToTree, downloadAsJson } from './lib/scaffoldGraph'
import { loadStoredState, saveStoredState, clearStoredState } from './lib/storage'

const SAVE_DEBOUNCE_MS = 300

function App() {
  const t = useScaffoldTranslation()
  const [nodes, setNodes] = useNodesState<Node<ScaffoldNodeData>>([])
  const [edges, setEdges] = useEdgesState<Edge>([])
  const [treeError, setTreeError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [themeDialogOpen, setThemeDialogOpen] = useState(false)
  const [localeDialogOpen, setLocaleDialogOpen] = useState(false)
  const initDone = useRef(false)

  useEffect(() => {
    document.title = t('pageTitle')
  }, [t])

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    const stored = loadStoredState()
    if (stored && (stored.nodes.length > 0 || stored.edges.length > 0)) {
      setNodes(stored.nodes)
      setEdges(stored.edges)
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

  const handleImport = (newNodes: Node<ScaffoldNodeData>[], newEdges: Edge[]) => {
    setNodes(newNodes)
    setEdges(newEdges)
  }

  const handleClear = () => {
    setNodes([])
    setEdges([])
    setTreeError(null)
    setImportError(null)
    clearStoredState()
  }

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
        <DialogRoot
          isOpen={themeDialogOpen || localeDialogOpen}
          onIsOpenChange={(open) => {
            if (!open) {
              setThemeDialogOpen(false)
              setLocaleDialogOpen(false)
            }
          }}
        >
          <div className="fixed top-4 right-4 flex gap-2 z-[1000]">
            <ThemeSwitcher onOpen={() => setThemeDialogOpen(true)} />
            <LanguageSwitcher onOpen={() => setLocaleDialogOpen(true)} />
          </div>
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
              />
            </main>
            <div className="absolute left-0 top-0 bottom-0 z-10 flex items-stretch">
              <Sidebar
                onExport={handleExport}
                onImport={handleImport}
                onClear={handleClear}
                importError={importError}
                setImportError={setImportError}
              />
            </div>
          </div>
        </DialogRoot>
      </div>
    </>
  )
}

export default App
