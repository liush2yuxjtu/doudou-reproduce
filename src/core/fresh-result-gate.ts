export class FreshResultGate {
  private latestCaptureId = 0;
  private currentSceneId: string | null = null;

  beginCapture(): number {
    this.latestCaptureId += 1;
    return this.latestCaptureId;
  }

  canCommitCapture(captureId: number): boolean {
    return captureId === this.latestCaptureId;
  }

  commitScene(captureId: number, sceneId: string): boolean {
    if (!this.canCommitCapture(captureId)) {
      return false;
    }

    this.currentSceneId = sceneId;
    return true;
  }

  canCommitAdvice(sceneId: string): boolean {
    return sceneId === this.currentSceneId;
  }
}
