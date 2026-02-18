import { memo } from 'react'
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Chip, IconButton } from '@helpwave/hightide'
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import { getChipColorForType } from '../lib/scaffoldGraph'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import type { ScaffoldTranslationEntries } from '../i18n/translations'
import { useNodeActions } from './NodeActionsContext'

function ScaffoldNodeInner({ id, data }: NodeProps<Node<ScaffoldNodeData>>) {
  const t = useScaffoldTranslation()
  const {
    onEditNode,
    onRequestDeleteNode,
    isRootOrgNode,
    getChildCount,
    isCollapsed,
    onExpand,
    onCollapse,
  } = useNodeActions()
  const d = data as ScaffoldNodeData
  const color = getChipColorForType(d.type)
  const typeLabel = t(`nodeType_${d.type}` as keyof ScaffoldTranslationEntries)
  const showDelete = !isRootOrgNode(id)
  const userSummary =
    d.type === 'USER' && d.user_metadata
      ? d.user_metadata.email ?? d.user_metadata.role ?? undefined
      : undefined
  const showTargetHandle = d.type !== 'ORGANIZATION'
  const showSourceHandle = d.type !== 'USER'
  const childCount = getChildCount(id)
  const hasChildren = childCount > 0
  const collapsed = isCollapsed(id)
  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow min-w-[160px] bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-2 [&_.react-flow__handle]:!bg-[#ffffff] [&_.react-flow__handle]:dark:!bg-[#0a0a0a]">
      {showTargetHandle && (
        <Handle type="target" position={Position.Top} className="!min-w-[14px] !min-h-[14px] !w-4 !h-4 !border-2 !border-gray-300 dark:!border-gray-600 !bg-[#ffffff] dark:!bg-[#0a0a0a]" />
      )}
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]" title={d.name}>
          {d.name}
        </span>
        {userSummary && (
          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={String(userSummary)}>
            {String(userSummary)}
          </span>
        )}
        {hasChildren && collapsed && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('childrenCount', { count: childCount })}
          </span>
        )}
        <div className="flex items-center justify-between gap-2">
          <Chip color={color} size="sm">
            {typeLabel}
          </Chip>
          <div className="flex items-center shrink-0 gap-0.5">
            {hasChildren && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  if (collapsed) { onExpand(id) } else { onCollapse(id) }
                }}
                aria-label={collapsed ? t('expandSubtree') : t('collapseSubtree')}
                title={collapsed ? t('expandSubtree') : t('collapseSubtree')}
                size="sm"
              >
                {collapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </IconButton>
            )}
            <IconButton
              onClick={(e) => { e.stopPropagation(); onEditNode(id) }}
              aria-label={t('nodeSettingsTitle')}
              title={t('nodeSettingsTitle')}
              size="sm"
            >
              <Pencil className="w-3.5 h-3.5" />
            </IconButton>
            {showDelete && (
              <IconButton
                onClick={(e) => { e.stopPropagation(); onRequestDeleteNode(id) }}
                aria-label={t('deleteNodeTitle')}
                title={t('deleteNodeTitle')}
                size="sm"
                color="negative"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </IconButton>
            )}
          </div>
        </div>
      </div>
      {showSourceHandle && (
        <Handle type="source" position={Position.Bottom} className="!min-w-[14px] !min-h-[14px] !w-4 !h-4 !border-2 !border-gray-300 dark:!border-gray-600 !bg-[#ffffff] dark:!bg-[#0a0a0a]" />
      )}
    </div>
  )
}

export const ScaffoldNode = memo(ScaffoldNodeInner)
