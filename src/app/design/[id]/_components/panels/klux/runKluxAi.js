/**
 * runKluxAi — the single integration seam for the Klux AI design assistant.
 * Everything above it (the composer, the message list, the working indicator)
 * is UI-only and already works; when the assistant is ready, replace the body
 * with the real call.
 *
 * Contract:
 *   input : { prompt: string, design: object, signal: AbortSignal }
 *   output: Promise<{ reply: string }>   // may also carry design ops later
 *
 * `design` is the current { canvas, elements } via editor.toDesign(), so the
 * assistant can reason about (and eventually edit) the live page. `signal`
 * lets the Stop button abort an in-flight request.
 *
 * Until it's wired, it throws KluxNotConnectedError so the panel shows a clear
 * "not connected yet" reply instead of hanging.
 */

export class KluxNotConnectedError extends Error {
  constructor() {
    super("Klux AI assistant is not connected yet.");
    this.name = "KluxNotConnectedError";
  }
}

export async function runKluxAi({ prompt, design, signal } = {}) {
  // TODO: paste the real assistant call here. Example:
  //   const res = await fetch("/api/klux-ai", {
  //     method: "POST",
  //     body: JSON.stringify({ prompt, design }),
  //     signal,
  //   });
  //   const data = await res.json();
  //   return { reply: data.reply };
  throw new KluxNotConnectedError();
}
