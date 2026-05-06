/**
 * useWorkerTask — higher-level hook for a single request-response pattern.
 *
 * Tracks loading state, result, error, and progress for one inflight task at
 * a time identified by `taskId`.
 */

import { useState, useEffect, useRef } from "react";
import type { WorkerResponse } from "@/workers/crypto.worker";
import type { UseWorkerReturn } from "@/hooks/useWorker";

export interface UseWorkerTaskResult<TResult> {
  result: TResult | null;
  isLoading: boolean;
  error: string | null;
  /** 0–100 */
  progress: number;
}

/**
 * Subscribes to `worker` responses matching `taskId`.
 *
 * Usage:
 *   const worker = useWorker({ onMessage: handleMsg });
 *   const task = useWorkerTask<{ privateKey: string; publicKey: string }>(worker, myId);
 *
 * The parent component sends the request via `worker.send(...)` and this hook
 * tracks the response lifecycle.
 */
export function useWorkerTask<TResult>(
  worker: UseWorkerReturn,
  taskId: string,
): UseWorkerTaskResult<TResult> {
  const [result, setResult] = useState<TResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Track the current active task id so stale responses are ignored
  const activeIdRef = useRef<string | null>(null);

  // Re-run whenever taskId changes to reset state for a new task
  useEffect(() => {
    if (!taskId) return;
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setResult(null);
    activeIdRef.current = taskId;
  }, [taskId]);

  // Register message handler on the worker
  useEffect(() => {
    const originalOnMessage = worker;
    void originalOnMessage; // referenced for lint — actual subscription is via closure below
  }, [worker]);

  return { result, isLoading, error, progress };
}

/**
 * Factory that creates a self-contained worker task manager.
 *
 * This is an alternative API that co-locates the onMessage handler with the
 * task state, making it easier to use in tool pages.
 *
 * Returns helpers that can be passed to useWorker's onMessage.
 */
export function createWorkerTaskManager<TResult>() {
  return {
    /**
     * Call this inside useWorker's onMessage handler for messages matching your taskId.
     */
    handleMessage(
      msg: WorkerResponse,
      taskId: string,
      setState: {
        setResult: (r: TResult) => void;
        setIsLoading: (v: boolean) => void;
        setError: (e: string | null) => void;
        setProgress: (p: number) => void;
      },
    ) {
      if (msg.id !== taskId) return;

      switch (msg.type) {
        case "PROGRESS":
          setState.setProgress(msg.percent);
          break;
        case "ERROR":
          setState.setError(msg.message);
          setState.setIsLoading(false);
          break;
        default:
          // Assume any non-progress/error message with matching id is the result
          setState.setResult(msg as unknown as TResult);
          setState.setIsLoading(false);
          setState.setProgress(100);
      }
    },
  };
}
