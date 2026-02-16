import { useEffect, useState } from 'react'
import { Button, Chip, Dialog, Input } from '@helpwave/hightide'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import type { AttachedDataEntry, ScaffoldEdgeData, ScaffoldNodeType, UserRole } from '../types/scaffold'
import type { ScaffoldTranslationEntries } from '../i18n/translations'

interface ConnectionSettingsDialogProps {
  isOpen: boolean,
  edgeId: string | null,
  edgeData: ScaffoldEdgeData | null,
  sourceLabel: string,
  targetLabel: string,
  sourceType?: ScaffoldNodeType,
  targetType?: ScaffoldNodeType,
  onClose: () => void,
  onSave: (edgeId: string, data: ScaffoldEdgeData) => void,
  onDelete: (edgeId: string) => void,
}

const USER_ROLES: UserRole[] = ['viewer', 'moderator', 'admin']

function roleLabelKey(role: UserRole): keyof ScaffoldTranslationEntries {
  return role === 'viewer' ? 'roleViewer' : role === 'moderator' ? 'roleModerator' : 'roleAdmin'
}

export function ConnectionSettingsDialog({
  isOpen,
  edgeId,
  edgeData,
  sourceLabel,
  targetLabel,
  sourceType,
  targetType,
  onClose,
  onSave,
  onDelete,
}: ConnectionSettingsDialogProps) {
  const t = useScaffoldTranslation()
  const [role, setRole] = useState<UserRole | undefined>(undefined)
  const [attributes, setAttributes] = useState<AttachedDataEntry[]>([])
  const [newAttachKey, setNewAttachKey] = useState('')
  const [newAttachValue, setNewAttachValue] = useState('')

  const isRoleAssignment = sourceType === 'USER' || targetType === 'USER'

  useEffect(() => {
    if (isOpen && edgeData) {
      setRole(edgeData.role)
      setAttributes(edgeData.attributes ?? [])
      setNewAttachKey('')
      setNewAttachValue('')
    }
  }, [isOpen, edgeData])

  const handleSave = () => {
    if (edgeId) {
      onSave(edgeId, {
        ...(isRoleAssignment ? { role } : {}),
        ...(attributes.length > 0 ? { attributes } : {}),
      })
      onClose()
    }
  }

  const handleDelete = () => {
    if (edgeId) {
      onDelete(edgeId)
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!edgeId) return null

  return (
    <Dialog
      titleElement={t('connectionSettingsTitle')}
      description={`${sourceLabel} → ${targetLabel}`}
      onClose={handleClose}
      isOpen={isOpen}
    >
      <div className="flex flex-col gap-4">
        {isRoleAssignment && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('userRole')}</span>
            <div className="flex flex-wrap gap-1.5">
              {USER_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(role === r ? undefined : r)}
                  className="cursor-pointer rounded border-0 bg-transparent p-0"
                  title={t(roleLabelKey(r))}
                >
                  <Chip size="sm" color={role === r ? 'primary' : 'neutral'}>
                    {t(roleLabelKey(r))}
                  </Chip>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('attachedData')}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              aria-label={t('key')}
              value={newAttachKey}
              onValueChange={setNewAttachKey}
              placeholder={t('key')}
            />
            <Input
              aria-label={t('value')}
              value={newAttachValue}
              onValueChange={setNewAttachValue}
              placeholder={t('value')}
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              const k = newAttachKey.trim()
              if (k && !attributes.some((e) => e.key === k)) {
                setAttributes((prev) => [...prev, { key: k, value: newAttachValue.trim() }])
                setNewAttachKey('')
                setNewAttachValue('')
              }
            }}
            disabled={!newAttachKey.trim()}
            title={t('add')}
          >
            {t('add')}
          </Button>
          {attributes.length > 0 && (
            <ul className="flex max-h-[160px] flex-col gap-1.5 overflow-auto rounded border border-gray-200 p-2 dark:border-gray-600">
              {attributes.map((entry, index) => (
                <li
                  key={`${entry.key}-${index}`}
                  className="flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1.5 text-sm dark:bg-gray-800"
                >
                  <span className="truncate font-mono">{entry.key}</span>
                  <span className="max-w-[120px] truncate text-gray-600 dark:text-gray-400">{entry.value}</span>
                  <Button
                    size="sm"
                    color="negative"
                    coloringStyle="text"
                    onClick={() => setAttributes((prev) => prev.filter((_, i) => i !== index))}
                    title={t('remove')}
                  >
                    {t('remove')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-between gap-2">
          <Button
            size="sm"
            color="negative"
            coloringStyle="text"
            onClick={handleDelete}
            title={t('delete')}
          >
            {t('delete')}
          </Button>
          <div className="flex gap-2">
            <Button coloringStyle="text" onClick={handleClose} title={t('cancel')}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} title={t('save')}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
