/**
 * CopyButton tests.
 *
 * jsdom doesn't implement navigator.clipboard by default.
 * We install a mock at module scope, which persists for all tests in this file.
 *
 * NOTE: userEvent with delay:null doesn't flush async clipboard ops correctly
 * in jsdom, so we use fireEvent.click + act() for async interaction tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { CopyButton } from "@/components/ui/CopyButton";

const writeTextMock = vi.fn();

// Install clipboard mock once for the module — jsdom doesn't provide it
Object.defineProperty(globalThis.navigator, "clipboard", {
  value: { writeText: writeTextMock },
  configurable: true,
  writable: true,
});

beforeEach(() => {
  writeTextMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Click the button and flush all pending microtasks so setState calls complete. */
const clickAndFlush = (element: Element) =>
  act(async () => {
    fireEvent.click(element);
    // Yield to the microtask queue so the async clipboard handler can complete
    await Promise.resolve();
  });

describe("CopyButton", () => {
  it("renders with default label", () => {
    render(<CopyButton value="test-secret" />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<CopyButton value="test-secret" label="Copy Key" />);
    expect(screen.getByText("Copy Key")).toBeInTheDocument();
  });

  it("has correct aria-label in idle state", () => {
    render(<CopyButton value="test-secret" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Copy to clipboard"
    );
  });

  it("calls clipboard.writeText with the value on click", async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CopyButton value="my-secret-key" />);

    await clickAndFlush(screen.getByRole("button"));

    expect(writeTextMock).toHaveBeenCalledWith("my-secret-key");
  });

  it("shows Copied! after a successful copy", async () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CopyButton value="my-secret-key" />);

    await clickAndFlush(screen.getByRole("button"));

    expect(screen.getByText("Copied!")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Copied to clipboard"
    );
  });

  it("shows Failed when clipboard write fails", async () => {
    writeTextMock.mockRejectedValue(new Error("denied"));
    render(<CopyButton value="my-secret-key" />);

    await clickAndFlush(screen.getByRole("button"));

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Copy failed"
    );
  });

  it("resets to idle after 1.5 s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    writeTextMock.mockResolvedValue(undefined);

    render(<CopyButton value="my-secret-key" />);

    await clickAndFlush(screen.getByRole("button"));

    // After click + promise flush, state should be "copied"
    expect(screen.getByText("Copied!")).toBeInTheDocument();

    // Advance the 1500ms reset timer
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("is disabled when value is empty", () => {
    render(<CopyButton value="" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call clipboard when value is empty", () => {
    writeTextMock.mockResolvedValue(undefined);
    render(<CopyButton value="" />);
    // Disabled buttons don't receive click events
    expect(writeTextMock).not.toHaveBeenCalled();
  });
});
