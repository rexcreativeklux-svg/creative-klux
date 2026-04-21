// app/api/pexels/videos/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const per_page = searchParams.get('per_page') || '30';
  const orientation = searchParams.get('orientation');

  if (!query) return Response.json({ error: 'query required' }, { status: 400 });

  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${per_page}${orientation ? `&orientation=${orientation}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  });

  if (!res.ok) return Response.json({ error: 'Failed' }, { status: 500 });

  const data = await res.json();
  return Response.json(data);
}