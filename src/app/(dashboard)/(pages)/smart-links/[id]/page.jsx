"use client";

// /smart-links/[id] — the SmartLink editor. See LinkEditor.jsx.
import { use } from "react";
import LinkEditor from "@/app/(components)/smart/LinkEditor";

export default function SmartLinkEditorPage({ params }) {
  const { id } = use(params);
  // key: opening another SmartLink (e.g. after Duplicate) starts a fresh editor.
  return <LinkEditor key={id} id={id} />;
}
