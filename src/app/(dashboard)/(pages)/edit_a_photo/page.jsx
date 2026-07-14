"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PhotoEditor from "./_components/PhotoEditor";

// /edit_a_photo — the full-screen photo editor as a real route (was a modal on
// the Product Photos page). The image to edit arrives via ?image=<url> and the
// mode via ?mode=<mode> (defaults to "start"). Colocate editor-only files in
// this folder going forward.
function EditAPhoto() {
  const router = useRouter();
  const params = useSearchParams();
  const image = params.get("image");
  const mode = params.get("mode") || "start";

  return (
    <PhotoEditor
      mode={mode}
      initialImageUrl={image || null}
      onClose={() => router.push("/product-studio")}
    />
  );
}

export default function EditAPhotoPage() {
  // useSearchParams() must sit under a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <EditAPhoto />
    </Suspense>
  );
}
