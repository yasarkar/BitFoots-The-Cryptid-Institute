import { describe, it, expect, vi } from "vitest";
import { gameEventBus, type FootprintCollectedPayload } from "./eventBus";

describe("gameEventBus", () => {
  it("delivers typed payloads to subscribers", () => {
    const handler = vi.fn();
    gameEventBus.on("FOOTPRINT_COLLECTED", handler);

    const payload: FootprintCollectedPayload = {
      id: "fp_1",
      scoreGained: 10,
      totalScore: 10,
      collectedCount: 1,
      totalCount: 8,
      remainingCount: 7,
    };
    gameEventBus.emit("FOOTPRINT_COLLECTED", payload);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(payload);
  });

  it("stops delivering after unsubscribe", () => {
    const handler = vi.fn();
    gameEventBus.on("TRIGGER_SONAR", handler);
    gameEventBus.off("TRIGGER_SONAR", handler);

    gameEventBus.emit("TRIGGER_SONAR");

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports void (undefined) payloads", () => {
    const handler = vi.fn();
    gameEventBus.on("RESUME_GAME", handler);

    gameEventBus.emit("RESUME_GAME");

    expect(handler).toHaveBeenCalledOnce();
  });

  it("isolates handlers between different event names", () => {
    const sonarHandler = vi.fn();
    const restartHandler = vi.fn();
    gameEventBus.on("TRIGGER_SONAR", sonarHandler);
    gameEventBus.on("RESTART_GAME", restartHandler);

    gameEventBus.emit("TRIGGER_SONAR");

    expect(sonarHandler).toHaveBeenCalledOnce();
    expect(restartHandler).not.toHaveBeenCalled();
  });
});
