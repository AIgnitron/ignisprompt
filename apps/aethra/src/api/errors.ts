export type AethraApiErrorKind =
  | "unreachable-daemon"
  | "timeout"
  | "http-error"
  | "invalid-json"
  | "unexpected-shape";

export class AethraApiError extends Error {
  readonly kind: AethraApiErrorKind;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    kind: AethraApiErrorKind,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = "AethraApiError";
    this.kind = kind;
    this.status = options.status;
    this.cause = options.cause;
  }
}
