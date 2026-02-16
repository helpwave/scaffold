import { useRef, useState } from 'react'
import { Button, Chip, ConfirmDialog } from '@helpwave/hightide'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import type { ScaffoldTranslationEntries } from '../i18n/translations'
import { getChipColorForType, treeToFlow } from '../lib/scaffoldGraph'
import { ScaffoldLogo } from './ScaffoldLogo'
import { SCAFFOLD_NODE_TYPES, SCAFFOLD_DRAG_TYPE } from '../types/scaffold'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import type { Node } from '@xyflow/react'
import type { Edge } from '@xyflow/react'
import type { TreeNode } from '../types/scaffold'
import { isScaffoldNodeType } from '../types/scaffold'

interface SidebarProps {
    onExport: () => void,
    onImport: (nodes: Node<ScaffoldNodeData>[], edges: Edge[]) => void,
    onClear: () => void,
    importError: string | null,
    setImportError: (msg: string | null) => void,
    hasRootOrg: boolean,
}

function parseTreeFile(raw: unknown): TreeNode[] {
    if (Array.isArray(raw)) {
        return raw.every((item) => item && typeof item === 'object' && 'name' in item && 'type' in item && isScaffoldNodeType((item as TreeNode).type))
            ? (raw as TreeNode[])
            : []
    }
    if (raw && typeof raw === 'object' && 'name' in raw && 'type' in raw && isScaffoldNodeType((raw as TreeNode).type)) {
        return [raw as TreeNode]
    }
    return []
}

export function Sidebar({ onExport, onImport, onClear, importError, setImportError, hasRootOrg }: SidebarProps) {
    const t = useScaffoldTranslation()
    const inputRef = useRef<HTMLInputElement>(null)
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false)

    const handleDragStart = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData(SCAFFOLD_DRAG_TYPE, type)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleImportClick = () => {
        setImportError(null)
        inputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            try {
                const raw = JSON.parse(reader.result as string) as unknown
                const tree = parseTreeFile(raw)
                if (tree.length === 0) {
                    setImportError(t('invalidJsonOrFormat'))
                    return
                }
                const { nodes, edges } = treeToFlow(tree)
                onImport(nodes, edges)
            } catch {
                setImportError(t('invalidJsonOrFormat'))
            }
        }
        reader.onerror = () => {
            setImportError(t('failedToReadFile'))
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    return (
        <aside className="min-w-[200px] shrink-0 flex flex-col h-[calc(100%-2rem)] my-4 ml-4 mr-2 bg-white dark:bg-[#0a0a0a] dark:border-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md p-5">
            <div className="pb-6 flex items-center gap-3">
                <ScaffoldLogo />
                <span className="typography-headline-md truncate" style={{ color: '#7b4cd9' }}>
                    {t('helpwaveScaffold')}
                </span>
            </div>
            <div className="pt-2 pb-1">
                <span className="typography-headline-sm">{t('nodeTypes')}</span>
            </div>
            <div className="flex-1 overflow-auto pt-4 flex flex-col gap-1.5">
                {SCAFFOLD_NODE_TYPES.filter((type) => type !== 'ORGANIZATION' || !hasRootOrg).map((type) => (
                    <div
                        key={type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, type)}
                        className="cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                    >
                        <Chip color={getChipColorForType(type)} size="sm">
                            {t(`nodeType_${type}` as keyof ScaffoldTranslationEntries)}
                        </Chip>
                    </div>
                ))}
            </div>
            <div className="pt-6 flex flex-col gap-2">
                {importError && (
                    <p className="text-sm text-red-600" role="alert">
                        {importError}
                    </p>
                )}
                <Button size="sm" onClick={onExport}>
                    {t('exportJson')}
                </Button>
                <Button size="sm" coloringStyle="outline" onClick={handleImportClick}>
                    {t('importJson')}
                </Button>
                <Button size="sm" color="negative" coloringStyle="outline" onClick={() => setIsClearDialogOpen(true)}>
                    {t('clear')}
                </Button>
                <ConfirmDialog
                    isOpen={isClearDialogOpen}
                    titleElement={t('clearGraphTitle')}
                    description={t('clearGraphDescription')}
                    confirmType="negative"
                    onCancel={() => setIsClearDialogOpen(false)}
                    onConfirm={() => {
                        onClear()
                        setIsClearDialogOpen(false)
                    }}
                />
                <input
                    ref={inputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </aside>
    )
}
