import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 対象は純粋ロジック(スキーム判定・値抽出・動作決定)のみ。
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
