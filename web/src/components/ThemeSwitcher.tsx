import { useState } from 'react'
import { DialogRoot, IconButton, ThemeDialog } from '@helpwave/hightide'
import { Palette } from 'lucide-react'

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DialogRoot isOpen={isOpen} onIsOpenChange={setIsOpen}>
      <IconButton
        onClick={() => setIsOpen(true)}
        aria-label="Change theme"
      >
        <Palette />
      </IconButton>
      <ThemeDialog isOpen={isOpen} />
    </DialogRoot>
  )
}
