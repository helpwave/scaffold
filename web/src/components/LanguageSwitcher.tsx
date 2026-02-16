import { useState } from 'react'
import { DialogRoot, IconButton, LanguageDialog } from '@helpwave/hightide'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DialogRoot isOpen={isOpen} onIsOpenChange={setIsOpen}>
      <IconButton
        onClick={() => setIsOpen(true)}
        aria-label="Change language"
      >
        <Languages />
      </IconButton>
      <LanguageDialog isOpen={isOpen} />
    </DialogRoot>
  )
}
