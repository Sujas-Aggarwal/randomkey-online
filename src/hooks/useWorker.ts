/**
 * useWorker — manages the lifecycle of the shared crypto Web Worker.
 *
 * Creates the worker once on mount, cleans up on unmount.
 * Returns a stable `send` function and a `ready` flag.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import type { WorkerRequest, WorkerResponse } from "@/workers/crypto.worker";

export interface UseWorkerOptions {
  onMessage: (msg: WorkerResponse) => void;
  onError?: (err: ErrorEvent) => void;
}

export interface UseWorkerReturn {
  send: (req: WorkerRequest) => void;
  ready: boolean;
  terminate: () => void;
}

export function useWorker({
  onMessage,
  onError,
}: UseWorkerOptions): UseWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);

  // Stable refs so effect deps don't cause re-creation
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/crypto.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      onMessageRef.current(event.data);
    };

    worker.onerror = (err: ErrorEvent) => {
      if (onErrorRef.current) {
        onErrorRef.current(err);
      } else {
        // Log worker errors to the console in development
        // biome-ignore format: keep it short
        void err; // suppress unused-variable warning; error visible in devtools
      }
    };

    workerRef.current = worker;
    setReady(true);

    return () => {
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, []); // only once

  const send = useCallback((req: WorkerRequest) => {
    const worker = workerRef.current;
    if (!worker) {
      throw new Error("Worker not ready");
    }
    worker.postMessage(req);
  }, []);

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setReady(false);
  }, []);

  return { send, ready, terminate };
}
