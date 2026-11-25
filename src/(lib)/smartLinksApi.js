// smartLinksApi.js
// ─────────────────────────────────────────────────────────────────────────────
// Every SmartLinks endpoint ("SmartLinks and Smart Inbox API.md", Nov 25 2026).
// Base /api/smart-links; public pages live at /api/sl/{slug} (the link's `url`).
//
// Shapes checked against the live API on 2026-11-25:
//   list       {links[], counts{all,live,draft}, templates[]}
//   link       id, title, slug, url, status, design, settings, blocks[], visits,
//              clicks, customers, value, published_at, created_at, updated_at
//   summary /  {visits, clicks, click_rate (null when no visits), customers,
//   analytics   value, daily[14]{date,visits,clicks}, sources[], blocks[]}

import api from "@/app/api/axios";
import { smartError } from "@/(lib)/smartInboxApi";

const BASE = "https://api.creativeklux.com/api/smart-links";

async function call(method, path, { brandId, body, params } = {}, fallback = "SmartLinks request failed") {
  try {
    const res = await api.request({
      method,
      url: `${BASE}${path}`,
      data: body,
      params,
      headers: brandId ? { "X-Brand-Id": String(brandId) } : {},
    });
    return res.data?.data ?? res.data;
  } catch (error) {
    throw smartError(error, fallback);
  }
}

/** q, status=live|draft, sort=new|visits|customers|az */
export const fetchLinks = (params = {}, { brandId } = {}) =>
  call("get", "", { brandId, params }, "Couldn't load your SmartLinks");
export const fetchLinksSummary = ({ brandId } = {}) =>
  call("get", "/summary", { brandId }, "Couldn't load SmartLinks numbers");
/** → {slug, available, error, url} */
export const checkSlug = (slug, ignore, { brandId } = {}) =>
  call("get", "/check-slug", { brandId, params: { slug, ...(ignore ? { ignore } : {}) } }, "Couldn't check the address");

export const createLink = ({ title, slug, template }, { brandId } = {}) =>
  call("post", "", { brandId, body: { title, slug, template } }, "Couldn't create the SmartLink");
export const fetchLink = (id, { brandId } = {}) =>
  call("get", `/${id}`, { brandId }, "Couldn't open the SmartLink");
/** The editor's Save: any of title, slug, status, design, settings, blocks. */
export const saveLink = (id, fields, { brandId } = {}) =>
  call("put", `/${id}`, { brandId, body: fields }, "Couldn't save the SmartLink");
export const publishLink = (id, { brandId } = {}) =>
  call("post", `/${id}/publish`, { brandId }, "Couldn't publish the SmartLink");
export const unpublishLink = (id, { brandId } = {}) =>
  call("post", `/${id}/unpublish`, { brandId }, "Couldn't unpublish the SmartLink");
export const duplicateLink = (id, { brandId } = {}) =>
  call("post", `/${id}/duplicate`, { brandId }, "Couldn't duplicate the SmartLink");
export const deleteLink = (id, { brandId } = {}) =>
  call("delete", `/${id}`, { brandId }, "Couldn't delete the SmartLink");
export const restoreLink = (id, { brandId } = {}) =>
  call("post", `/${id}/restore`, { brandId }, "Couldn't restore the SmartLink");
export const fetchLinkAnalytics = (id, { brandId } = {}) =>
  call("get", `/${id}/analytics`, { brandId }, "Couldn't load this SmartLink's numbers");
