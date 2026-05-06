import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EntropyMeter } from "@/components/ui/EntropyMeter";

describe("EntropyMeter", () => {
  it("renders a meter element with correct aria attributes", () => {
    render(<EntropyMeter bits={64} />);
    const meter = screen.getByRole("meter");
    expect(meter).toBeInTheDocument();
    expect(meter).toHaveAttribute("aria-valuenow", "64");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "128");
  });

  it("shows 'Very Weak' label for bits < 40", () => {
    render(<EntropyMeter bits={30} showLabel />);
    expect(screen.getByText("Very Weak")).toBeInTheDocument();
  });

  it("shows 'Weak' label for bits in [40, 60)", () => {
    render(<EntropyMeter bits={50} showLabel />);
    expect(screen.getByText("Weak")).toBeInTheDocument();
  });

  it("shows 'Fair' label for bits in [60, 80)", () => {
    render(<EntropyMeter bits={70} showLabel />);
    expect(screen.getByText("Fair")).toBeInTheDocument();
  });

  it("shows 'Strong' label for bits in [80, 120)", () => {
    render(<EntropyMeter bits={100} showLabel />);
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("shows 'Very Strong' label for bits >= 120", () => {
    render(<EntropyMeter bits={128} showLabel />);
    expect(screen.getByText("Very Strong")).toBeInTheDocument();
  });

  it("does not render label text when showLabel=false", () => {
    render(<EntropyMeter bits={100} showLabel={false} showBits={false} />);
    // None of these should appear
    expect(screen.queryByText("Strong")).not.toBeInTheDocument();
    expect(screen.queryByText("Very Strong")).not.toBeInTheDocument();
  });

  it("shows bits count when showBits=true", () => {
    render(<EntropyMeter bits={128} showBits />);
    expect(screen.getByText("128 bits")).toBeInTheDocument();
  });

  it("does not show bits count when showBits=false (default)", () => {
    render(<EntropyMeter bits={128} />);
    expect(screen.queryByText("128 bits")).not.toBeInTheDocument();
  });

  it("aria-label contains the label text", () => {
    // 64 bits = "Fair" per entropyLabel thresholds (< 80 = fair)
    render(<EntropyMeter bits={64} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-label", expect.stringContaining("Fair"));
  });

  it("aria-label contains bits when showBits=true", () => {
    render(<EntropyMeter bits={64} showBits />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-label", expect.stringContaining("64 bits"));
  });
});
