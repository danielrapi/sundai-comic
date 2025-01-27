import { NextResponse } from 'next/server';

type ComicFrame = {
  prompt: string;
  caption: string;
  imageUrl: string;
};

type ComicData = {
  frames: ComicFrame[];
};

// Use Map with specific types
const comicStore = new Map<string, ComicData>();

export async function POST(request: Request) {
  try {
    const comic: ComicData = await request.json();
    const id = Math.random().toString(36).substring(2, 15);
    comicStore.set(id, comic);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Failed to store comic' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Comic ID is required' }, { status: 400 });
  }

  const comic = comicStore.get(id);
  if (!comic) {
    return NextResponse.json({ error: 'Comic not found' }, { status: 404 });
  }

  return NextResponse.json(comic);
} 