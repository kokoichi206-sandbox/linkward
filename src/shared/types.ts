// chrome.storage.local に永続化する型。content / background / 各 UI が共有する契約層。

// スキーム別の既定動作。
// confirm=毎回確認 / block=常にブロック / copy=値をコピー / allow=常に許可
export type SchemeAction = 'confirm' | 'block' | 'copy' | 'allow'

export interface Settings {
  // ブロック対象スキーム(プロトコル名のみ、':' は含めない)。カスタム追加もここに足す。
  schemes: string[]
  // スキームごとの既定動作。
  schemeRules: Record<string, SchemeAction>
  // host 単位の allowlist。host -> 常に許可するスキーム配列。
  allowSites: Record<string, string[]>
}

// 確認 UI または既定動作の結果として実際に行われた操作。
export type HistoryAction =
  | 'copy'
  | 'open'
  | 'block'
  | 'cancel'
  | 'allow-site'
  | 'block-scheme'

export interface HistoryEntry {
  id: string // crypto.randomUUID()
  at: string // ISO8601。記録時刻
  pageUrl: string // クリックが起きたページ
  scheme: string // 例: 'mailto'
  href: string // リンク全文。例: 'mailto:a@example.com?subject=hi'
  action: HistoryAction
}

// chrome.storage.local 全体のスキーマ。
export interface StorageSchema {
  settings: Settings
  history: HistoryEntry[] // 新しい順。上限超過分は古いものから捨てる
}
