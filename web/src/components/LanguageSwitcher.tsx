import { IconButton } from '@helpwave/hightide'
import { Languages } from 'lucide-react'

type LanguageSwitcherProps = {
  onOpen: () => void,
}

export function LanguageSwitcher({ onOpen }: LanguageSwitcherProps) {
  return (
    <IconButton onClick={onOpen} aria-label="Change language" title="Change language">
      <Languages />
    </IconButton>
  )
}
