"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/app/(components)/ProtectedRoutes";
import DesignEditor from "./_components/DesignEditor";
import PracticeLoader from "@/app/(components)/PracticeLoader";

/**
 * Normalize a raw API design record into the editor's { id, name, canvas,
 * elements } shape. Handles structured (canvas+elements) designs and raster
 * (image_url only) creatives — the latter becomes a single full-bleed image
 * element sized to the image so it's editable like any other layer.
 */
async function toEditorDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }

  let canvas = null;
  let elements = [];
  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvas = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) {
      canvas = parsed;
    }
  }

  const image = raw.image_url || raw.image || null;

  // Structured design → use as-is.
  if (canvas && (elements.length || !image)) {
    return {
      id: raw.id,
      name: raw.name || "Untitled design",
      canvas,
      elements,
    };
  }

  // Raster creative → wrap the image in a canvas sized to its natural dims.
  if (image) {
    const dims = await imageSize(image).catch(() => ({ w: 1080, h: 1080 }));
    return {
      id: raw.id,
      name: raw.name || "Untitled design",
      canvas: { width: dims.w, height: dims.h, background: "#ffffff" },
      elements: [
        {
          type: "image",
          src: image,
          x: 0,
          y: 0,
          width: dims.w,
          height: dims.h,
        },
      ],
    };
  }

  // Nothing usable → blank canvas.
  return {
    id: raw.id,
    name: raw.name || "Untitled design",
    canvas: canvas || { width: 1080, height: 1080, background: "#ffffff" },
    elements,
  };
}

function imageSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}

function DesignEditorRoute() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Deep-link support: `?panel=klux` opens the editor with the Klux AI panel
  // already open (used by the "Edit with Ai" entry point on My Creations).
  const initialPanel = searchParams.get("panel");
  const { fetchDesignById, activeBrandId } = useAuth();

  const [design, setDesign] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let alive = true;
    (async () => {
      setStatus("loading");
      const raw = await fetchDesignById(id);
      if (!alive) return;
      if (!raw) {
        setStatus("error");
        return;
      }
      const d = await toEditorDesign(raw);
      if (!alive) return;
      setDesign(d);
      setStatus("ready");
    })();
    return () => {
      alive = false;
    };
    // Re-run if the id changes or the brand becomes available (fallback lookup).
  }, [id, fetchDesignById, activeBrandId]);

  if (status === "loading") {
    return <PracticeLoader label="Loading your design" />;
  }

  if (status === "error" || !design) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-gray-100 dark:bg-canvas text-gray-500">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm">We couldn&apos;t load this design.</p>
        <button
          onClick={() => router.push("/creatives")}
          className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer transition"
        >
          Back to My Creations
        </button>
      </div>
    );
  }

  return (
    <DesignEditor
      design={design}
      initialPanel={initialPanel}
      onBack={() => router.push("/creatives")}
    />
  );
}

export default function DesignEditorPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PracticeLoader label="Loading your design" />}>
        <DesignEditorRoute />
      </Suspense>
    </ProtectedRoute>
  );
}
