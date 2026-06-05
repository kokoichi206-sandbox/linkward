// Service Worker 内で read-modify-write を直列化する mutex。
// 「background が唯一の writer」と併せて、複数タブ同時書き込みでのロスト更新を防ぐ。
let chain: Promise<unknown> = Promise.resolve()

export function withLock<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(task, task)
  // 前段が失敗してもチェーンは止めない。
  chain = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}
