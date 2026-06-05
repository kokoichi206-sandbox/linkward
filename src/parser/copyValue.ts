// ブロック対象 URL から「コピーする値」を抽出する。
// 例: mailto:a@example.com?subject=hi -> a@example.com / tel:+81-3-... -> +81-3-...

// 'scheme:' の後ろを返す。scheme は extractScheme 済みの名前である前提。
function stripScheme(scheme: string, href: string): string {
  return href.trim().slice(scheme.length + 1)
}

// '?'(クエリ)より前を返す。
function beforeQuery(value: string): string {
  const index = value.indexOf('?')
  return index === -1 ? value : value.slice(0, index)
}

// percent エンコードを復元する。href は外部入力なので不正な % 列は原文のまま返す
// (外部入力バリデーションの既定値であり、エラーの握りつぶしではない)。
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function extractCopyValue(scheme: string, href: string): string {
  const body = stripScheme(scheme, href)
  switch (scheme) {
    // mailto は宛先のみ(subject/body は捨てる)。複数宛先 a@x,b@y はそのまま。
    case 'mailto':
      return safeDecode(beforeQuery(body))
    // 電話/SMS は番号部分のみ。
    case 'tel':
    case 'sms':
      return beforeQuery(body)
    // それ以外(webcal/zoommtg/カスタム)はリンク全文をコピーする。
    default:
      return href.trim()
  }
}
