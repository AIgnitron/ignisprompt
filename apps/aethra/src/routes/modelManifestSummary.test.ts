import { describe, expect, it } from "vitest";
import { ModelManifest } from "../api/contracts";
import { modelFixtures } from "../api/fixtures";
import {
  countDeclaredLocalPaths,
  countDeclaredPromptPacks,
  countInstalledManifestHints,
  findModelManifestById,
  getManifestStatusHints,
  toModelManifestRows,
} from "./modelManifestSummary";

describe("model manifest fixture summaries", () => {
  it("builds manifest rows from fixture data", () => {
    const rows = toModelManifestRows(modelFixtures);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      modelId: "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
      tier: "TIER_3",
      domains: "legal, contracts, compliance",
      format: "gguf",
      quantization: "q4_k_m",
      contextWindow: "8192",
      localPath: "./models/qwen2.5-0.5b-instruct-q4_k_m.gguf",
      promptPack: "legal-contract-review-compact-v0.1.md",
      responseFormat: "schema",
      installed: true,
      source: "local-gguf",
    });
  });

  it("finds a model manifest by id", () => {
    expect(
      findModelManifestById(
        modelFixtures,
        "legal-qwen2.5-0.5b-instruct-q4-k-m-local",
      )?.displayName,
    ).toContain("Qwen2.5");
  });

  it("counts manifest-derived hints", () => {
    expect(countInstalledManifestHints(modelFixtures)).toBe(1);
    expect(countDeclaredLocalPaths(modelFixtures)).toBe(1);
    expect(countDeclaredPromptPacks(modelFixtures)).toBe(1);
  });

  it("does not infer runner readiness from manifest fields", () => {
    expect(getManifestStatusHints(modelFixtures[0])).toEqual([
      "Manifest loaded",
      "Local path declared",
      "Prompt pack declared",
      "Runner readiness unknown",
      "File existence not verified by Aethra in fixture mode",
    ]);
  });

  it("handles missing optional manifest fields", () => {
    const minimalManifest: ModelManifest = {
      modelId: "fixture-minimal-model",
      displayName: "Fixture Minimal Model",
      tier: 1,
      domains: [],
      format: "stub",
      installed: false,
    };

    expect(toModelManifestRows([minimalManifest])[0]).toMatchObject({
      quantization: "not declared",
      contextWindow: "not declared",
      localPath: "not declared",
      promptPack: "not declared",
      responseFormat: "not declared",
      source: "not declared",
      sha256: "not declared",
      version: "not declared",
    });
    expect(getManifestStatusHints(minimalManifest)).toEqual([
      "Manifest loaded",
      "Local path not declared",
      "Prompt pack not declared",
      "Runner readiness unknown",
      "File existence not verified by Aethra in fixture mode",
    ]);
  });

  it("handles null optional manifest fields from daemon responses", () => {
    const nullOptionManifest: ModelManifest = {
      modelId: "fixture-null-option-model",
      displayName: "Fixture Null Option Model",
      tier: 1,
      domains: [],
      format: "stub",
      quantization: null,
      contextWindow: null,
      localPath: null,
      promptPack: null,
      responseFormat: null,
      sha256: null,
      version: null,
      installed: false,
      source: null,
    };

    expect(toModelManifestRows([nullOptionManifest])[0]).toMatchObject({
      quantization: "not declared",
      contextWindow: "not declared",
      localPath: "not declared",
      promptPack: "not declared",
      responseFormat: "not declared",
      source: "not declared",
      sha256: "not declared",
      version: "not declared",
    });
    expect(countDeclaredLocalPaths([nullOptionManifest])).toBe(0);
    expect(countDeclaredPromptPacks([nullOptionManifest])).toBe(0);
    expect(getManifestStatusHints(nullOptionManifest)).toEqual([
      "Manifest loaded",
      "Local path not declared",
      "Prompt pack not declared",
      "Runner readiness unknown",
      "File existence not verified by Aethra in fixture mode",
    ]);
  });
});
