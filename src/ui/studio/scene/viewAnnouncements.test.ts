import { describe, expect, it } from "vitest";
import type { ViewCommand, ViewEvent } from "../../../state";
import { describeView, isImmediate, summariseSteps } from "./viewAnnouncements";

let seq = 0;
const event = (command: ViewCommand, limitReached = false): ViewEvent => ({
  seq: ++seq,
  command,
  source: "keyboard",
  limitReached,
});
const turn = (direction: "left" | "right" | "up" | "down", limit = false) =>
  event({ type: "turn", direction }, limit);
const zoom = (direction: "in" | "out", limit = false) => event({ type: "zoom", direction }, limit);
const move = (limit = false) => event({ type: "move", direction: "left" }, limit);

describe("view announcements", () => {
  it("announces the views at once", () => {
    for (const view of ["reset", "top", "front"] as const) {
      const viewEvent = event({ type: "view", view });
      expect(isImmediate(viewEvent)).toBe(true);
      expect(describeView(viewEvent)).toEqual({ key: view });
    }
    expect(isImmediate(turn("left"))).toBe(false);
    expect(describeView(turn("left"))).toBeNull();
  });

  it("sums the turns of a run of arrows (15° sideways, 10° up / down)", () => {
    expect(summariseSteps([turn("right"), turn("right")])).toEqual([
      { key: "turnRight", degrees: 30 },
    ]);
    expect(summariseSteps([turn("left")])).toEqual([{ key: "turnLeft", degrees: 15 }]);
    expect(summariseSteps([turn("left"), turn("left"), turn("right")])).toEqual([
      { key: "turnLeft", degrees: 15 },
    ]);
    expect(summariseSteps([turn("up"), turn("up")])).toEqual([{ key: "turnUp", degrees: 20 }]);
    expect(summariseSteps([turn("down")])).toEqual([{ key: "turnDown", degrees: 10 }]);
  });

  it("says nothing when the steps cancel out", () => {
    expect(summariseSteps([turn("left"), turn("right")])).toEqual([]);
    expect(summariseSteps([])).toEqual([]);
  });

  it("reports the zoom direction, and the limit instead when the last step hit it", () => {
    expect(summariseSteps([zoom("in"), zoom("in")])).toEqual([{ key: "zoomIn" }]);
    expect(summariseSteps([zoom("in"), zoom("out")])).toEqual([{ key: "zoomOut" }]);
    expect(summariseSteps([zoom("in"), zoom("in", true)])).toEqual([{ key: "zoomLimit" }]);
  });

  it("reports a move, or a reached limit for moves and turns", () => {
    expect(summariseSteps([move(), move()])).toEqual([{ key: "moved" }]);
    expect(summariseSteps([move(), move(true)])).toEqual([{ key: "viewLimit" }]);
    expect(summariseSteps([turn("up"), turn("up", true)])).toEqual([{ key: "viewLimit" }]);
  });

  it("keeps one sentence per kind of step, in order, in a single announcement", () => {
    expect(summariseSteps([turn("right"), zoom("in"), zoom("in"), move()])).toEqual([
      { key: "turnRight", degrees: 15 },
      { key: "zoomIn" },
      { key: "moved" },
    ]);
    expect(summariseSteps([turn("right"), turn("up")])).toEqual([
      { key: "turnRight", degrees: 15 },
      { key: "turnUp", degrees: 10 },
    ]);
  });

  it("ignores view events mixed in the steps", () => {
    expect(summariseSteps([event({ type: "view", view: "top" }), zoom("out")])).toEqual([
      { key: "zoomOut" },
    ]);
  });
});
