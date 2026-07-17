/**
 * Small pure helpers shared by the brand-create flow.
 */

// Pull a hosted URL out of a gallery upload response — the field name varies
// across endpoints, so we probe the common shapes (top-level and nested `data`).
export const pickUploadedUrl = (res) => {
  const pick = (o) =>
    o?.image ||
    o?.image_url ||
    o?.url ||
    o?.file_url ||
    o?.path ||
    o?.src ||
    null;
  return pick(res) || pick(res?.data) || null;
};

// Placeholder credentials for a "connected" social/ad account, used until the
// real OAuth handshake is wired up.
export const generateMockCredentials = () => ({
  token: `tok_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
  id: `id_${Math.random().toString(36).substr(2, 9)}`,
});
