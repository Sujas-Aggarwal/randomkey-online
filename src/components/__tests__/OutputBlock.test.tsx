import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutputBlock } from "@/components/ui/OutputBlock";

describe("OutputBlock", () => {
  it("renders the value", () => {
    render(<OutputBlock value="my-secret-value" />);
    expect(screen.getByText("my-secret-value")).toBeInTheDocument();
  });

  it("renders a label when provided", () => {
    render(<OutputBlock value="abc123" label="API Key" />);
    expect(screen.getByText("API Key")).toBeInTheDocument();
  });

  it("has aria-live='polite' for screen reader announcements", () => {
    render(<OutputBlock value="my-secret-value" />);
    const liveRegion = screen.getByRole("region");
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("uses the label as aria-label when provided", () => {
    render(<OutputBlock value="abc" label="Generated Key" />);
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Generated Key"
    );
  });

  it("uses aria-label prop when provided", () => {
    render(<OutputBlock value="abc" aria-label="Custom label" />);
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Custom label"
    );
  });

  it("falls back to 'Generated value' aria-label", () => {
    render(<OutputBlock value="abc" />);
    expect(screen.getByRole("region")).toHaveAttribute(
      "aria-label",
      "Generated value"
    );
  });

  it("renders em-dash when value is empty", () => {
    render(<OutputBlock value="" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("applies blur class when obscured", () => {
    const { container } = render(<OutputBlock value="secret" obscured />);
    // The text span should have blur class
    const blurredSpan = container.querySelector(".blur-sm");
    expect(blurredSpan).toBeInTheDocument();
  });

  it("reveals value on hover when obscured", async () => {
    const user = userEvent.setup();
    const { container } = render(<OutputBlock value="secret" obscured />);

    const region = screen.getByRole("region");
    await user.hover(region);

    // After hover, blur should be removed
    expect(container.querySelector(".blur-sm")).not.toBeInTheDocument();
  });

  it("hides blur when focused (keyboard accessible)", async () => {
    const user = userEvent.setup();
    const { container } = render(<OutputBlock value="secret" obscured />);

    const region = screen.getByRole("region");
    await user.click(region); // focus

    expect(container.querySelector(".blur-sm")).not.toBeInTheDocument();
  });

  it("does not add tabIndex when not obscured", () => {
    render(<OutputBlock value="secret" />);
    expect(screen.getByRole("region")).not.toHaveAttribute("tabindex");
  });

  it("adds tabIndex=0 when obscured for keyboard access", () => {
    render(<OutputBlock value="secret" obscured />);
    expect(screen.getByRole("region")).toHaveAttribute("tabindex", "0");
  });
});
