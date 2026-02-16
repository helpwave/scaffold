import { IconButton } from '@helpwave/hightide'
import { Palette } from 'lucide-react'

type ThemeSwitcherProps = {
  onOpen: () => void,
}

export function ThemeSwitcher({ onOpen }: ThemeSwitcherProps) {
  return (
    <IconButton onClick={onOpen} aria-label="Change theme" title="Change theme">
      <Palette />
    </IconButton>
  )
}
