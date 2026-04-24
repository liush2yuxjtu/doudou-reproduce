export type IpcOk<T> = { ok: true; data: T };
export type IpcFail = { ok: false; error: string; duplicate?: boolean };
export type IpcResult<T> = IpcOk<T> | IpcFail;

export async function safeInvoke<T>(fn: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const dup = (error as Record<string, unknown>)?.duplicate;
    const result: IpcFail = { ok: false, error: message };
    if (dup === true || dup === false) {
      result.duplicate = dup as boolean;
    }
    return result;
  }
}
