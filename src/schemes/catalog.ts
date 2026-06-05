// ブロック候補スキームのカタログ。options ページの選択肢と既定値(全 ON)の元になる。
export interface SchemeInfo {
  scheme: string // プロトコル名(':' なし)
  label: string // 表示名
}

export const SCHEME_CATALOG: SchemeInfo[] = [
  { scheme: 'mailto', label: 'メール (mailto:)' },
  { scheme: 'tel', label: '電話 (tel:)' },
  { scheme: 'sms', label: 'SMS (sms:)' },
  { scheme: 'webcal', label: 'カレンダー (webcal:)' },
  { scheme: 'zoommtg', label: 'Zoom (zoommtg:)' },
  { scheme: 'slack', label: 'Slack (slack:)' },
  { scheme: 'notion', label: 'Notion (notion:)' },
  { scheme: 'figma', label: 'Figma (figma:)' },
  { scheme: 'vscode', label: 'VS Code (vscode:)' },
  { scheme: 'cursor', label: 'Cursor (cursor:)' },
  { scheme: 'obsidian', label: 'Obsidian (obsidian:)' },
  { scheme: 'discord', label: 'Discord (discord:)' },
]

export const ALL_SCHEMES: string[] = SCHEME_CATALOG.map((info) => info.scheme)
