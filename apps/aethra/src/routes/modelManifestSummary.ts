import { ModelManifest } from "../api/contracts";

export type ModelManifestRow = {
  modelId: string;
  displayName: string;
  tier: string;
  domains: string;
  format: string;
  quantization: string;
  contextWindow: string;
  localPath: string;
  promptPack: string;
  responseFormat: string;
  installed: boolean;
  source: string;
  sha256: string;
  version: string;
};

export function toModelManifestRows(
  models: ModelManifest[],
): ModelManifestRow[] {
  return [...models]
    .sort((left, right) => left.modelId.localeCompare(right.modelId))
    .map((model) => ({
      modelId: model.modelId,
      displayName: model.displayName,
      tier: `TIER_${model.tier}`,
      domains: model.domains.join(", "),
      format: model.format,
      quantization: model.quantization ?? "not declared",
      contextWindow:
        model.contextWindow == null
          ? "not declared"
          : String(model.contextWindow),
      localPath: model.localPath ?? "not declared",
      promptPack: model.promptPack ?? "not declared",
      responseFormat: model.responseFormat ?? "not declared",
      installed: model.installed,
      source: model.source ?? "not declared",
      sha256: model.sha256 ?? "not declared",
      version: model.version ?? "not declared",
    }));
}

export function findModelManifestById(
  models: ModelManifest[],
  modelId: string,
): ModelManifest | undefined {
  return models.find((model) => model.modelId === modelId);
}

export function countInstalledManifestHints(models: ModelManifest[]): number {
  return models.filter((model) => model.installed).length;
}

export function countDeclaredLocalPaths(models: ModelManifest[]): number {
  return models.filter((model) => model.localPath != null).length;
}

export function countDeclaredPromptPacks(models: ModelManifest[]): number {
  return models.filter((model) => model.promptPack != null).length;
}

export function getManifestStatusHints(model: ModelManifest): string[] {
  return [
    "Manifest loaded",
    model.localPath == null
      ? "Local path not declared"
      : "Local path declared",
    model.promptPack == null
      ? "Prompt pack not declared"
      : "Prompt pack declared",
    "Runner readiness unknown",
    "File existence not verified by Aethra in fixture mode",
  ];
}
