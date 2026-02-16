export const SCAFFOLD_DRAG_TYPE = 'application/x-scaffold-node-type'

export const ROOT_ORG_ID = 'node-root-organization'

export const SCAFFOLD_NODE_TYPES = [
  'ORGANIZATION',
  'NETWORK',
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

export type UserRole = 'viewer' | 'moderator' | 'admin'

export interface UserLocation {
  street?: string,
  city?: string,
  country?: string,
}

export interface UserMetadata {
  email?: string,
  firstname?: string,
  lastname?: string,
  role?: UserRole,
  location?: UserLocation,
}

export interface AttachedDataEntry {
  key: string,
  value: string,
}

export interface TreeNode {
  name: string,
  type: ScaffoldNodeType,
  organization_ids?: string[],
  user_metadata?: UserMetadata,
  attached_data?: AttachedDataEntry[],
  children?: TreeNode[],
}

export function isScaffoldNodeType(s: string): s is ScaffoldNodeType {
  return SCAFFOLD_NODE_TYPES.includes(s as ScaffoldNodeType)
}
