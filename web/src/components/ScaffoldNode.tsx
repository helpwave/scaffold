import { Handle, type Node, type NodeProps, Position } from '@xyflow/react'
import { Chip } from '@helpwave/hightide'
import { getChipColorForType } from '../lib/scaffoldGraph'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'

export function ScaffoldNode({ data }: NodeProps<Node<ScaffoldNodeData>>) {
  const d = data as ScaffoldNodeData
  const color = getChipColorForType(d.type)
  return (
    <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow min-w-[160px] bg-[#ffffff] dark:bg-[#0a0a0a] px-3 py-2 [&_.react-flow__handle]:!bg-[#ffffff] [&_.react-flow__handle]:dark:!bg-[#0a0a0a]">
      <Handle type="target" position={Position.Top} className="!min-w-[14px] !min-h-[14px] !w-4 !h-4 !border-2 !border-gray-300 dark:!border-gray-600 !bg-[#ffffff] dark:!bg-[#0a0a0a]" />
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]" title={d.name}>
          {d.name}
        </span>
        <Chip color={color} size="sm">
          {d.type}
        </Chip>
      </div>
      <Handle type="source" position={Position.Bottom} className="!min-w-[14px] !min-h-[14px] !w-4 !h-4 !border-2 !border-gray-300 dark:!border-gray-600 !bg-[#ffffff] dark:!bg-[#0a0a0a]" />
    </div>
  )
}
