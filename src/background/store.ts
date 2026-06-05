import { mergeSettings } from '../settings/defaults'
import type {
  HistoryEntry,
  SchemeAction,
  Settings,
  StorageSchema,
} from '../shared/types'
import type { NewHistoryInput } from '../shared/messages'
import { withLock } from './mutex'

// 履歴の保持上限。超過分は古いものから捨てる。
const HISTORY_LIMIT = 500

// storage は外部入力なので欠損時は既定で補完する。
async function readAll(): Promise<StorageSchema> {
  const raw = await chrome.storage.local.get(['settings', 'history'])
  return {
    settings: mergeSettings(raw.settings as Partial<Settings> | undefined),
    history: (raw.history as HistoryEntry[] | undefined) ?? [],
  }
}

export async function getSettings(): Promise<Settings> {
  return (await readAll()).settings
}

export async function listHistory(): Promise<HistoryEntry[]> {
  return (await readAll()).history
}

// ブロック操作を1件記録する。新しい順に先頭へ積み、上限でローテートする。
export function recordHistory(input: NewHistoryInput): Promise<HistoryEntry> {
  return withLock(async () => {
    const { history } = await readAll()
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      ...input,
    }
    const next = [entry, ...history].slice(0, HISTORY_LIMIT)
    await chrome.storage.local.set({ history: next })
    return entry
  })
}

export function clearHistory(): Promise<void> {
  return withLock(async () => {
    await chrome.storage.local.set({ history: [] })
  })
}

// このサイト(host)でこのスキームを常に許可する。
export function allowSite(host: string, scheme: string): Promise<Settings> {
  return withLock(async () => {
    const { settings } = await readAll()
    const current = settings.allowSites[host] ?? []
    const allowSites = current.includes(scheme)
      ? settings.allowSites
      : { ...settings.allowSites, [host]: [...current, scheme] }
    const next: Settings = { ...settings, allowSites }
    await chrome.storage.local.set({ settings: next })
    return next
  })
}

// このスキームの既定動作を block に変える。
export function blockScheme(scheme: string): Promise<Settings> {
  return withLock(async () => {
    const { settings } = await readAll()
    const next: Settings = {
      ...settings,
      schemeRules: { ...settings.schemeRules, [scheme]: 'block' },
    }
    await chrome.storage.local.set({ settings: next })
    return next
  })
}

// スキームの有効/無効を切り替える(options のチェックボックス)。
// 有効化時に動作が未設定なら confirm を補う。
export function setSchemeEnabled(
  scheme: string,
  enabled: boolean,
): Promise<Settings> {
  return withLock(async () => {
    const { settings } = await readAll()
    const schemes = enabled
      ? settings.schemes.includes(scheme)
        ? settings.schemes
        : [...settings.schemes, scheme]
      : settings.schemes.filter((s) => s !== scheme)
    const schemeRules =
      enabled && settings.schemeRules[scheme] === undefined
        ? { ...settings.schemeRules, [scheme]: 'confirm' as SchemeAction }
        : settings.schemeRules
    const next: Settings = { ...settings, schemes, schemeRules }
    await chrome.storage.local.set({ settings: next })
    return next
  })
}

// スキームの既定動作を変更する。
export function setSchemeRule(
  scheme: string,
  action: SchemeAction,
): Promise<Settings> {
  return withLock(async () => {
    const { settings } = await readAll()
    const next: Settings = {
      ...settings,
      schemeRules: { ...settings.schemeRules, [scheme]: action },
    }
    await chrome.storage.local.set({ settings: next })
    return next
  })
}
