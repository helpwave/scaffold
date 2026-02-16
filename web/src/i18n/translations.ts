// AUTO-GENERATED. DO NOT EDIT.
/* eslint-disable @stylistic/quote-props */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Translation } from '@helpwave/internationalization'

export const scaffoldTranslationLocales = ['de-DE', 'en-US'] as const

export type ScaffoldTranslationLocales = typeof scaffoldTranslationLocales[number]

export type ScaffoldTranslationEntries = {
  'add': string,
  'addNodeTitle': (values: { type: string }) => string,
  'addOrganizationIdPlaceholder': string,
  'cancel': string,
  'clear': string,
  'clearGraphDescription': string,
  'clearGraphTitle': string,
  'connectionWouldCreateCycle': string,
  'eachNodeOneParent': string,
  'enterNameForNode': string,
  'enterNamePlaceholder': string,
  'exportJson': string,
  'failedToReadFile': string,
  'helpwaveScaffold': string,
  'importJson': string,
  'invalidJsonOrFormat': string,
  'name': string,
  'nodeSettingsTitle': string,
  'nodeTypes': string,
  'onlyOnDesktop': string,
  'organizationIds': string,
  'pageTitle': string,
  'remove': string,
  'save': string,
}

export const scaffoldTranslation: Translation<ScaffoldTranslationLocales, Partial<ScaffoldTranslationEntries>> = {
  'de-DE': {
    'add': `Hinzufügen`,
    'addNodeTitle': ({ type }): string => {
      return `${type} hinzufügen`
    },
    'addOrganizationIdPlaceholder': `ID hinzufügen`,
    'cancel': `Abbrechen`,
    'clear': `Löschen`,
    'clearGraphDescription': `Alle Knoten und Kanten werden entfernt. Dies kann nicht rückgängig gemacht werden.`,
    'clearGraphTitle': `Graph löschen?`,
    'connectionWouldCreateCycle': `Diese Verbindung würde einen Zyklus erzeugen. Der Graph muss ein Baum bleiben.`,
    'eachNodeOneParent': `Jeder Knoten kann nur einen übergeordneten Knoten haben. Der Graph muss ein Baum bleiben.`,
    'enterNameForNode': `Gib einen Namen für den neuen Knoten ein.`,
    'enterNamePlaceholder': `Name eingeben`,
    'exportJson': `JSON exportieren`,
    'failedToReadFile': `Datei konnte nicht gelesen werden.`,
    'helpwaveScaffold': `helpwave scaffold`,
    'importJson': `JSON importieren`,
    'invalidJsonOrFormat': `Ungültiges JSON oder Format.`,
    'name': `Name`,
    'nodeSettingsTitle': `Knoten-Einstellungen`,
    'nodeTypes': `Knotentypen`,
    'onlyOnDesktop': `Nur auf Desktop-Geräten`,
    'organizationIds': `Organisations-IDs`,
    'pageTitle': `helpwave scaffold`,
    'remove': `Entfernen`,
    'save': `Speichern`
  },
  'en-US': {
    'add': `Add`,
    'addNodeTitle': ({ type }): string => {
      return `Add ${type}`
    },
    'addOrganizationIdPlaceholder': `Add ID`,
    'cancel': `Cancel`,
    'clear': `Clear`,
    'clearGraphDescription': `Remove all nodes and edges. This cannot be undone.`,
    'clearGraphTitle': `Clear graph?`,
    'connectionWouldCreateCycle': `This connection would create a cycle. The graph must stay a tree.`,
    'eachNodeOneParent': `Each node can have only one parent. The graph must stay a tree.`,
    'enterNameForNode': `Enter a name for the new node.`,
    'enterNamePlaceholder': `Enter name`,
    'exportJson': `Export JSON`,
    'failedToReadFile': `Failed to read file.`,
    'helpwaveScaffold': `helpwave scaffold`,
    'importJson': `Import JSON`,
    'invalidJsonOrFormat': `Invalid JSON or format.`,
    'name': `Name`,
    'nodeSettingsTitle': `Node settings`,
    'nodeTypes': `Node types`,
    'onlyOnDesktop': `Only on desktop devices`,
    'organizationIds': `Organization IDs`,
    'pageTitle': `helpwave scaffold`,
    'remove': `Remove`,
    'save': `Save`
  }
}

