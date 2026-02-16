import { useState } from 'react'
import { Button, Dialog, Input } from '@helpwave/hightide'
import { useScaffoldTranslation } from '../i18n/ScaffoldTranslationContext'

interface NamePopUpProps {
    isOpen: boolean,
    onClose: () => void,
    onSubmit: (name: string) => void,
    typeLabel: string,
}

export function NamePopUp({ isOpen, onClose, onSubmit, typeLabel }: NamePopUpProps) {
    const t = useScaffoldTranslation()
    const [name, setName] = useState('')

    const handleConfirm = () => {
        const trimmed = name.trim()
        if (trimmed) {
            onSubmit(trimmed)
            setName('')
            onClose()
        }
    }

    const handleClose = () => {
        setName('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <Dialog
            titleElement={t('addNodeTitle', { type: typeLabel })}
            description={t('enterNameForNode')}
            onClose={handleClose}
            isOpen={isOpen}
        >
            <div className="flex flex-col gap-3">
                <Input
                    aria-label={t('name')}
                    value={name}
                    onValueChange={setName}
                    onEditComplete={(v) => v && handleConfirm()}
                    placeholder={t('enterNamePlaceholder')}
                />
                <div className="flex gap-2 justify-end mt-3">
                    <Button coloringStyle="text" onClick={handleClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleConfirm} disabled={!name.trim()}>
                        {t('add')}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
