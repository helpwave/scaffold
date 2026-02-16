export const SCAFFOLD_DRAG_TYPE = 'application/x-scaffold-node-type'

export const SCAFFOLD_NODE_TYPES = [
  'HOSPITAL',
  'PRACTICE',
  'CLINIC',
  'WARD',
  'ROOM',
  'BED',
  'TEAM',
  'USER',
] as const

export type ScaffoldNodeType = (typeof SCAFFOLD_NODE_TYPES)[number];

export interface TreeNode {
  name: string,
  type: ScaffoldNodeType,
  children?: TreeNode[],
}

export function isScaffoldNodeType(s: string): s is ScaffoldNodeType {
  return SCAFFOLD_NODE_TYPES.includes(s as ScaffoldNodeType)
}
