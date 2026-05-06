import "@testing-library/jest-dom";
import { webcrypto } from "crypto";

// Ensure WebCrypto is available in jsdom test environment (Node 20+)
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}
