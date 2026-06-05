# CLAUDE.md

Web ページが勝手に外部アプリ(mailto: / tel: 等)を開くのを止める Chrome 拡張。機能と使い方は [README](./README.md) を参照(ここでは重複させない)。

## Stack

WXT + TypeScript(strict) + pnpm。確認 UI は素の DOM を Shadow DOM に差し込む(フレームワークなし)。

## Commands

- `pnpm dev` — 開発(Chrome 起動して拡張をロード)
- `pnpm build` — 本番ビルド(`.output/chrome-mv3`)
- `pnpm test` — ユニットテスト(vitest)
- `pnpm compile` — 型チェック(`tsc --noEmit`)
- `pnpm lint` / `pnpm format` — ESLint / Prettier

## 検証の境界(コードから読めない前提)

- 純粋ロジック(`src/schemes` のスキーム判定・`src/parser` の値抽出・`src/settings/decide` の動作決定)だけがユニットテスト対象。
- クリック横取り・外部アプリ起動・Shadow DOM 描画・クリップボードは **実機 Chrome でしか検証できない**。

## 守る原則(プロジェクト固有・必ず守る)

- **暗黙の fallback を作らない。** クリップボード失敗や未設定スキームを黙って握りつぶさず、トースト/確認 UI で明示する。未設定スキームは「黙って許可」ではなく confirm(確認)に倒す。
- **storage の書き込みは background が単一 writer。** 複数タブ同時クリックでのロスト更新を `src/background/mutex.ts` の `withLock` で防ぐ。content は storage を読むだけ + `onChanged` を購読し、書き込みは必ず `sendToBackground` 経由。
- **クリックは capture phase で横取りし、対象スキームなら `preventDefault` + `stopImmediatePropagation`。** サイト自身のハンドラより先に止める。
- **未信頼データの描画は `textContent` のみ。** href/pageUrl は外部入力。`innerHTML` を使わない。
- コメントは Why のみ。

## アーキテクチャの継ぎ目

- 対象スキームの増減は `src/settings/defaults.ts`(既定)と storage の `settings.schemes`。判定は `src/schemes/match.ts` がスキーム名で一律に行うので、カスタムスキーム追加はデータ追加だけで済む。
- 「実際に何をするか」は `src/settings/decide.ts`(allowlist > schemeRules)に集約。UI(`src/ui/overlay.ts`)は決定を持たず、content がコールバックで配線する。
- popup / options は未実装。storage 層(`src/background/store.ts`)が揃っているので、表示・編集ビューを足すだけ。

## 落とし穴

- クリップボードは secure context(https) + ユーザー操作が必須。http ページや未フォーカスでは `navigator.clipboard` が失敗しうる。失敗は握りつぶさずトーストで出す。
- pnpm 環境で `prettier .` が node_modules を辿るため、format/format:check は `.` でなく scoped glob。`.` に戻さない。
