import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const translationsPath = path.resolve(__dirname, '../src/i18n/translations.ts')

let content = fs.readFileSync(translationsPath, 'utf8')
content = content.replace(/import \{ TranslationGen \} from '@helpwave\/internationalization'\n/, '')
fs.writeFileSync(translationsPath, content)
