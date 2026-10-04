import { describe, expect, it } from "vitest";
import { asUuidOrNull, isHostedFileIntelligenceEnabled, persistFileIntelligenceDocument } from "./hosted-metadata";

describe("hosted file intelligence metadata", () => {
  it("accepts only real UUIDs for uuid columns", () => {
    expect(asUuidOrNull("u-qm")).toBeNull();
    expect(asUuidOrNull("doc-1")).toBeNull();
    expect(asUuidOrNull("2f1c5a8e-3b6d-4e9a-a1c2-7d8e9f0a1b2c")).toBe("2f1c5a8e-3b6d-4e9a-a1c2-7d8e9f0a1b2c");
  });

  it("does not persist to Postgres when Supabase service role is absent", async () => {
    expect(isHostedFileIntelligenceEnabled()).toBe(false);
    await expect(persistFileIntelligenceDocument("doc-missing")).resolves.toBeUndefined();
  });
});
