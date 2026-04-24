/**
 * FreshResultGate —— 保证截屏/场景/建议三阶段 pipeline 只有"最新一拍"能落地。
 *
 * 刻意**不提供 reset API**。原因：
 *   - `beginCapture()` 每次单调递增 `latestCaptureId`，立即使此前所有 in-flight captureId 失效；
 *   - `commitScene()` 成功后会单调覆盖 `currentSceneId`，使旧 sceneId 对应的 advice 被拒；
 *   - 这两点已经构成了事实上的"重置"语义。额外的 `reset()` 只会引入竞态窗口，且让失败路径变成隐式状态。
 *
 * 状态变迁（单调）：
 *   - `latestCaptureId`: 0 → 1 → 2 → ... 严格单调递增，由 `beginCapture()` 触发；
 *   - `currentSceneId`: null → sceneA → sceneB → ... 由 `commitScene()` 成功分支单调覆盖；
 *     失败分支（`canCommitCapture` 返回 false）**不**写 `currentSceneId`，旧场景保持。
 *
 * 失败路径：
 *   - `commitScene()` 拿到过期 captureId 时直接返回 false，不 throw、不改状态；
 *   - 失败的 capture 自动失效（永远 canCommitCapture === false），无需外部清理。
 */
export class FreshResultGate {
  private latestCaptureId = 0;
  private currentSceneId: string | null = null;

  /** 开启一次新截屏，递增并返回 captureId；此前所有 in-flight captureId 立刻失效。 */
  beginCapture(): number {
    this.latestCaptureId += 1;
    return this.latestCaptureId;
  }

  /** 判定给定 captureId 是否仍为最新一拍；失败分支永不恢复。 */
  canCommitCapture(captureId: number): boolean {
    return captureId === this.latestCaptureId;
  }

  /** 仅当 captureId 仍为最新时才覆盖 currentSceneId；过期 captureId 返回 false 且不改状态。 */
  commitScene(captureId: number, sceneId: string): boolean {
    if (!this.canCommitCapture(captureId)) {
      return false;
    }

    this.currentSceneId = sceneId;
    return true;
  }

  /** 判定 advice 对应的 sceneId 是否仍为当前场景；场景切换后旧 advice 立刻被拒。 */
  canCommitAdvice(sceneId: string): boolean {
    return sceneId === this.currentSceneId;
  }
}
