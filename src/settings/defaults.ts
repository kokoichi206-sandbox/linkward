import { ALL_SCHEMES } from '../schemes/catalog'
import type { SchemeAction, Settings } from '../shared/types'

// 既定はカタログ全スキームを有効化(デフォルト全部 ON)。動作はすべて confirm(毎回確認)。
// 黙ってブロック/許可せず、まずユーザーに選ばせる方向に倒す。
export const DEFAULT_SETTINGS: Settings = {
  schemes: ALL_SCHEMES,
  schemeRules: Object.fromEntries(
    ALL_SCHEMES.map((scheme): [string, SchemeAction] => [scheme, 'confirm']),
  ),
  allowSites: {},
}

// 保存値と既定をマージする。
// schemes/allowSites はユーザーが要素を削除できるよう「あれば保存値で置換」。
// schemeRules はスキーム追加時に既定動作を欠損なく補えるよう per-key マージ。
export function mergeSettings(stored: Partial<Settings> | undefined): Settings {
  return {
    schemes: stored?.schemes ?? DEFAULT_SETTINGS.schemes,
    schemeRules: { ...DEFAULT_SETTINGS.schemeRules, ...stored?.schemeRules },
    allowSites: stored?.allowSites ?? DEFAULT_SETTINGS.allowSites,
  }
}
