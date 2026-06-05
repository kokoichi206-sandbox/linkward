# linkward

Web サイトが勝手に外部アプリ(`mailto:` / `tel:` / `sms:` / `webcal:` / `zoommtg:` 等)を開くのを、クリックの瞬間に止める Chrome 拡張(Manifest V3)。開く前に「コピー / 今回だけ開く / 常に許可 / 常にブロック」を選べる。

> Intercepts external app links (mailto:, tel:, etc.) before they hijack your browser — confirm, copy, or block.

## 何をするか

対象スキームのリンクをクリックすると、外部アプリを起動する前に確認 UI を出す。

- **コピーする** — `mailto:` はメールアドレスだけ、`tel:`/`sms:` は番号だけを抽出してコピー
- **今回は開く** — その場で外部アプリを起動
- **このサイトでは常に許可** — host 単位の allowlist に追加
- **この種類は常にブロック** — スキーム単位で常時ブロック
- **キャンセル**

ブロック/操作の履歴は `chrome.storage.local` に記録する(最新 500 件)。

## 対象スキーム(MVP)

`mailto` / `tel` / `sms` / `webcal` / `zoommtg`。将来はカスタムスキーム(`slack` / `notion` / `cursor` 等)を追加可能にする。

## 開発

```sh
pnpm install
pnpm dev        # Chrome を起動して拡張をロード
pnpm test       # ユニットテスト
pnpm compile    # 型チェック
pnpm build      # 本番ビルド(.output/chrome-mv3)
```

## 構成

- `entrypoints/content.ts` — capture phase で `a[href]` クリックを横取りし、対象スキームを判定して UI を出す
- `entrypoints/background.ts` — storage の単一 writer。履歴・設定を直列化して保存
- `src/schemes` — スキーム判定 / `src/parser` — コピー値の抽出 / `src/settings` — 設定と動作決定 / `src/ui` — Shadow DOM の確認 UI

## 未実装(次イテレーション)

popup / options ページ(設定編集・履歴ビューア)、カスタムスキーム追加 UI、リンクの事前マーキング、修飾キーでの一時許可、`window.open()` 経由の検知。
