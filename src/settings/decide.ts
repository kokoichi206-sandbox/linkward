import type { SchemeAction, Settings } from '../shared/types'

// クリックされたスキームに対して実際に取る動作を決める(純粋関数)。
export function decideAction(
  scheme: string,
  host: string,
  settings: Settings,
): SchemeAction {
  // サイト別 allowlist が最優先。このサイトでこのスキームは常に許可。
  if (settings.allowSites[host]?.includes(scheme)) return 'allow'
  // 未設定スキームは黙って通さず確認に倒す(安全側)。
  return settings.schemeRules[scheme] ?? 'confirm'
}
