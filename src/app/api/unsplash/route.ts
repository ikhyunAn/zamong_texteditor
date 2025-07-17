import { NextRequest, NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export async function GET(request: NextRequest) {
  if (!UNSPLASH_ACCESS_KEY) {
    return NextResponse.json(
      { error: 'Unsplash API key not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || 'nature landscape';
  const page = searchParams.get('page') || '1';
  const perPage = searchParams.get('per_page') || '12';

  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      results: data.results.map((photo: any) => ({
        id: photo.id,
        urls: {
          small: photo.urls.small,
          regular: photo.urls.regular,
          full: photo.urls.full,
        },
        alt_description: photo.alt_description || photo.description || 'Unsplash image',
        user: {
          name: photo.user.name,
        },
      })),
      total: data.total,
      total_pages: data.total_pages,
    });
  } catch (error) {
    console.error('Error fetching from Unsplash:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Unsplash' },
      { status: 500 }
    );
  }
}
