import { defineConfig } from 'wxt'

// https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'linkward',
    description: 'Web サイトが勝手に外部アプリを開くのを、クリック時に止める',
    // 設定(スキーム別ルール / サイト別 allowlist)とブロック履歴の保存に使う。
    // クリップボードはユーザー操作 + secure context で navigator.clipboard を使うため宣言不要。
    permissions: ['storage'],
    // ツールバーアイコンのクリックを background で受け、設定画面を開く。
    action: {},
  },
})
