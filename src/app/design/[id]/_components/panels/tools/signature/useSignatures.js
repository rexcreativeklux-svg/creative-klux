"use client";

import { useState } from "react";

/**
 * useSignatures — the Signature tool's data + persistence.
 *
 * THERE IS NO BACKEND ENDPOINT YET. This hook is the seam where it lands: keep
 * the returned shape and only this file changes — the flyout, tiles, and Create
 * view stay as they are.
 *
 * When the endpoint exists, front each call with AuthContext.authFetch so a 401
 * logs out through the same path as everything else:
 *   - `signatures` ← GET    (list for the current user/brand)
 *   - `save(sig)`  ← POST    (persist a created signature; upload the image
 *                             first for kind:"image", then store the URL),
 *                            then refresh the list
 *   - `remove(id)` ← DELETE
 *
 * A signature is one of:
 *   { id, kind: "text",  name, fontFamily, color }
 *   { id, kind: "image", src, name? }
 * `insertSignature` turns either into the right canvas element.
 *
 * @returns {{
 *   signatures: object[],
 *   loading: boolean,
 *   error: string|null,
 *   canSave: boolean,
 *   save: (sig: object) => Promise<void>,
 * }}
 */
export default function useSignatures() {
  // Always empty until the endpoint exists. State (not a constant) so swapping
  // in the fetch doesn't change this hook's shape.
  const [signatures] = useState([]);

  // Flips to true when the endpoint is wired; the Create view reads it to enable
  // the "Save signature" toggle. Until then, saving is unavailable.
  const canSave = false;

  const save = async () => {
    // No-op placeholder: with no endpoint there's nowhere to persist. Created
    // signatures are still added to the canvas — they're just not remembered.
  };

  return { signatures, loading: false, error: null, canSave, save };
}
