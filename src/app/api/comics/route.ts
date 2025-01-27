import { NextResponse } from 'next/server';

// In a real app, you'd use a database. For now, we'll use in-memory storage
const comicStore = new Map<string, any>();

export async function POST(request: Request) {
  try {
    const comic = await request.json();
    const id = Math.random().toString(36).substring(2, 15);
    comicStore.set(id, comic);
    return NextResponse.json({ id });
  } catch (error) {
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