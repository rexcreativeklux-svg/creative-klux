/**
 * Shared error for the Magic Studio generation seams. Thrown until a real
 * pipeline is pasted in, so the panel can show a clear "not connected" message
 * instead of failing silently or faking results.
 */
export class MagicNotConnectedError extends Error {
  constructor(mode = "generation") {
    super(`Magic Studio ${mode} is not connected yet.`);
    this.name = "MagicNotConnectedError";
  }
}
