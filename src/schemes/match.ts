// URL スキーム(プロトコル)を判定する。content script のクリック横取りで使う。

// RFC3986 のスキーム文法。先頭の空白は許容して trim 後に判定する。
const SCHEME_PATTERN = /^([a-zA-Z][a-zA-Z0-9+.-]*):/

// href からスキーム名(小文字、':' は含めない)を取り出す。相対 URL や anchor は null。
export function extractScheme(href: string): string | null {
  const matched = SCHEME_PATTERN.exec(href.trim())
  return matched ? matched[1].toLowerCase() : null
}

// href がブロック対象スキームなら、その名前を返す。対象外は null。
export function matchBlockedScheme(
  href: string,
  blocked: readonly string[],
): string | null {
  const scheme = extractScheme(href)
  return scheme !== null && blocked.includes(scheme) ? scheme : null
}
