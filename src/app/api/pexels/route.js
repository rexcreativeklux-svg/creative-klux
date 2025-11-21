import { NextResponse } from "next/server";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const type = searchParams.get("type") || "photos"; // photos or videos
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("per_page") || "20";

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

    const url = `${baseUrl}?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Pexels API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from Pexels" },
      { status: 500 }
    );
  }
}
