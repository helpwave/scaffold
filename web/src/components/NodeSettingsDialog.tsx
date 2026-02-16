import { useEffect, useState } from 'react'
import { Button, Dialog, DialogRoot, Input } from '@helpwave/hightide'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'

interface NodeSettingsDialogProps {
  isOpen: boolean,
  nodeId: string | null,
  nodeData: ScaffoldNodeData | null,
  onClose: () => void,
  onSave: (nodeId: string, data: Partial<ScaffoldNodeData>) => void,
}

export function NodeSettingsDialog({
  isOpen,
  nodeId,
  nodeData,
  onClose,
  onSave,
}: NodeSettingsDialogProps) {
  const t = useScaffoldTranslation()
  const [organizationIds, setOrganizationIds] = useState<string[]>([])
  const [newIdInput, setNewIdInput] = useState('')

  useEffect(() => {
    if (isOpen && nodeData) {
      setOrganizationIds(nodeData.organization_ids ?? [])
      setNewIdInput('')
    }
  }, [isOpen, nodeData])

  const handleAdd = () => {
    const trimmed = newIdInput.trim()
    if (trimmed && !organizationIds.includes(trimmed)) {
      setOrganizationIds((prev) => [...prev, trimmed])
      setNewIdInput('')
    }
  }

  const handleRemove = (index: number) => {
    setOrganizationIds((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (nodeId && nodeData) {
      onSave(nodeId, {
        ...nodeData,
        organization_ids: organizationIds.length > 0 ? organizationIds : undefined,
      })
      onClose()
    }
  }

  const handleClose = () => {
    setNewIdInput('')
    onClose()
  }

  if (!nodeData || !nodeId) return null

  return (
    <DialogRoot
      isOpen={isOpen}
      onIsOpenChange={(open) => {
        if (!open) handleClose()
      }}
      isModal
    >
      <Dialog
        titleElement={t('nodeSettingsTitle')}
        description={nodeData.name}
        onClose={handleClose}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('organizationIds')}
            </span>
            <div className="flex gap-2">
              <Input
                aria-label={t('addOrganizationIdPlaceholder')}
                value={newIdInput}
                onValueChange={setNewIdInput}
                onEditComplete={(v) => {
                  if (v?.trim()) handleAdd()
                }}
                placeholder={t('addOrganizationIdPlaceholder')}
              />
              <Button size="sm" onClick={handleAdd} disabled={!newIdInput.trim()}>
                {t('add')}
              </Button>
            </div>
            {organizationIds.length > 0 && (
              <ul className="flex flex-col gap-1.5 max-h-[200px] overflow-auto rounded border border-gray-200 dark:border-gray-600 p-2">
                {organizationIds.map((id, index) => (
                  <li
                    key={`${id}-${index}`}
                    className="flex items-center justify-between gap-2 rounded bg-gray-50 dark:bg-gray-800 px-2 py-1.5"
                  >
                    <span className="truncate text-sm font-mono">{id}</span>
                    <Button
                      size="sm"
                      color="negative"
                      coloringStyle="text"
                      onClick={() => handleRemove(index)}
                    >
                      {t('remove')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button coloringStyle="text" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  )
}
