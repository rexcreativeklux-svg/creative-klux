import { NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "photos";
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";
  const orientation = searchParams.get("orientation");

  if (!PEXELS_API_KEY) {
    return NextResponse.json(
      { error: "Pexels API key not configured" },
      { status: 500 }
    );
  }

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const baseUrl =
      type === "videos"
        ? "https://api.pexels.com/videos/search"
        : "https://api.pexels.com/v1/search";

    // Fix: Add missing closing brace and backtick
    const url = `${baseUrl}?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}${orientation ? `&orientation=${orientation}` : ''}`;

    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      // Fix: Proper template literal syntax
      const errorText = await response.text();
      console.error(`Pexels API error (${response.status}):`, errorText);
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Log what we received
    console.log('Pexels API response:', {
      type,
      query,
      hasVideos: !!data.videos,
      hasPhotos: !!data.photos,
      videosCount: data.videos?.length,
      photosCount: data.photos?.length
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Pexels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Pexels", details: error.message },
      { status: 500 }
    );
  }
}