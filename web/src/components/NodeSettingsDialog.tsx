import { useEffect, useState } from 'react'
import { Button, Dialog, Input } from '@helpwave/hightide'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'
import type { ScaffoldNodeData } from '../lib/scaffoldGraph'
import type { AttachedDataEntry, UserMetadata } from '../types/scaffold'

interface NodeSettingsDialogProps {
    isOpen: boolean,
    nodeId: string | null,
    nodeData: ScaffoldNodeData | null,
    onClose: () => void,
    onSave: (nodeId: string, data: Partial<ScaffoldNodeData>) => void,
    onDelete: (nodeId: string) => void,
    isRootOrgNode: boolean,
}

export function NodeSettingsDialog({
    isOpen,
    nodeId,
    nodeData,
    onClose,
    onSave,
    onDelete,
    isRootOrgNode,
}: NodeSettingsDialogProps) {
    const t = useScaffoldTranslation()
    const [organizationIds, setOrganizationIds] = useState<string[]>([])
    const [newIdInput, setNewIdInput] = useState('')
    const [email, setEmail] = useState('')
    const [firstname, setFirstname] = useState('')
    const [lastname, setLastname] = useState('')
    const [street, setStreet] = useState('')
    const [city, setCity] = useState('')
    const [country, setCountry] = useState('')
    const [attachedData, setAttachedData] = useState<AttachedDataEntry[]>([])
    const [newAttachKey, setNewAttachKey] = useState('')
    const [newAttachValue, setNewAttachValue] = useState('')

    useEffect(() => {
        if (isOpen && nodeData) {
            setOrganizationIds(nodeData.organization_ids ?? [])
            setNewIdInput('')
            const um = nodeData.user_metadata
            setEmail(um?.email ?? '')
            setFirstname(um?.firstname ?? '')
            setLastname(um?.lastname ?? '')
            setStreet(um?.location?.street ?? '')
            setCity(um?.location?.city ?? '')
            setCountry(um?.location?.country ?? '')
            setAttachedData(nodeData.attached_data ?? [])
            setNewAttachKey('')
            setNewAttachValue('')
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
            let user_metadata: UserMetadata | undefined = nodeData.user_metadata
            if (nodeData.type === 'USER') {
                const loc =
                    street.trim() || city.trim() || country.trim()
                        ? { street: street.trim() || undefined, city: city.trim() || undefined, country: country.trim() || undefined }
                        : undefined
                const hasAny =
                    email.trim() || firstname.trim() || lastname.trim() || loc
                user_metadata = hasAny
                    ? {
                        email: email.trim() || undefined,
                        firstname: firstname.trim() || undefined,
                        lastname: lastname.trim() || undefined,
                        location: loc,
                    }
                    : undefined
            }
            onSave(nodeId, {
                ...nodeData,
                organization_ids: organizationIds.length > 0 ? organizationIds : undefined,
                user_metadata,
                attached_data: attachedData.length > 0 ? attachedData : undefined,
            })
            onClose()
        }
    }

    const handleClose = () => {
        setNewIdInput('')
        onClose()
    }

    const handleDelete = () => {
        if (nodeId) {
            onDelete(nodeId)
            onClose()
        }
    }

    if (!nodeData || !nodeId) return null

    const isUser = nodeData.type === 'USER'

    return (
        <Dialog
            titleElement={t('nodeSettingsTitle')}
            description={nodeData.name}
            onClose={handleClose}
            isOpen={isOpen}
        >
            <div className="flex flex-col gap-4">
                {isUser && (
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('userMetadata')}
                        </span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Input
                                aria-label={t('email')}
                                value={email}
                                onValueChange={setEmail}
                                placeholder={t('email')}
                            />
                            <Input
                                aria-label={t('firstname')}
                                value={firstname}
                                onValueChange={setFirstname}
                                placeholder={t('firstname')}
                            />
                            <Input
                                aria-label={t('lastname')}
                                value={lastname}
                                onValueChange={setLastname}
                                placeholder={t('lastname')}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 border-t border-gray-200 dark:border-gray-600 pt-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('location')}</span>
                            <Input
                                aria-label={t('street')}
                                value={street}
                                onValueChange={setStreet}
                                placeholder={t('street')}
                            />
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <Input
                                    aria-label={t('city')}
                                    value={city}
                                    onValueChange={setCity}
                                    placeholder={t('city')}
                                />
                                <Input
                                    aria-label={t('country')}
                                    value={country}
                                    onValueChange={setCountry}
                                    placeholder={t('country')}
                                />
                            </div>
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
                            if (k && !attachedData.some((e) => e.key === k)) {
                                setAttachedData((prev) => [...prev, { key: k, value: newAttachValue.trim() }])
                                setNewAttachKey('')
                                setNewAttachValue('')
                            }
                        }}
                        disabled={!newAttachKey.trim()}
                        title={t('add')}
                    >
                        {t('add')}
                    </Button>
                    {attachedData.length > 0 && (
                        <ul className="flex flex-col gap-1.5 max-h-[160px] overflow-auto rounded border border-gray-200 dark:border-gray-600 p-2">
                            {attachedData.map((entry, index) => (
                                <li
                                    key={`${entry.key}-${index}`}
                                    className="flex items-center justify-between gap-2 rounded bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-sm"
                                >
                                    <span className="truncate font-mono">{entry.key}</span>
                                    <span className="truncate text-gray-600 dark:text-gray-400 max-w-[120px]">{entry.value}</span>
                                    <Button
                                        size="sm"
                                        color="negative"
                                        coloringStyle="text"
                                        onClick={() => setAttachedData((prev) => prev.filter((_, i) => i !== index))}
                                        title={t('remove')}
                                    >
                                        {t('remove')}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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
                        <Button size="sm" onClick={handleAdd} disabled={!newIdInput.trim()} title={t('add')}>
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
                                        title={t('remove')}
                                    >
                                        {t('remove')}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {!isRootOrgNode && (
                        <Button
                            size="sm"
                            color="negative"
                            coloringStyle="text"
                            onClick={handleDelete}
                            title={t('delete')}
                        >
                            {t('delete')}
                        </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
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
