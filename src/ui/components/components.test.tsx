import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axeViolations } from "../../../tests/unit/helpers/ui";
import { Button } from "./Button";
import { cx } from "./cx";
import { Icon } from "./Icon";
import { ProgressBar } from "./ProgressBar";

afterEach(cleanup);

describe("ui components", () => {
  it("ProgressBar: determinate value or indeterminate, named by its label", async () => {
    const { container } = render(
      <>
        <p id="l1">Saving</p>
        <ProgressBar aria-labelledby="l1" value={60} />
        <p id="l2">Loading</p>
        <ProgressBar aria-labelledby="l2" />
      </>,
    );
    const determinate = screen.getByRole("progressbar", { name: "Saving" });
    expect(determinate.getAttribute("aria-valuenow")).toBe("60");
    expect(determinate.querySelector("span")?.style.width).toBe("60%");
    const indeterminate = screen.getByRole("progressbar", { name: "Loading" });
    expect(indeterminate.hasAttribute("aria-valuenow")).toBe(false);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("Button: variants and icon-only button keep their accessible name", () => {
    render(
      <Button variant="ghost" size="sm" iconOnly aria-label="Close" className="extra">
        <Icon name="x" size="sm" />
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Close" });
    expect(button.className).toContain("extra");
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("cx skips empty class names", () => {
    expect(cx("a", undefined, false, null, "", "b")).toBe("a b");
  });
});
