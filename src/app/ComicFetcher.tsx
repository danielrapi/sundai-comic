'use client';
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';

const ComicFetcher = ({ setFrames, setShowComic }: { setFrames: (frames: any) => void, setShowComic: (show: boolean) => void }) => {
  const searchParams = useSearchParams();
  const comicId = searchParams.get('id');

  useEffect(() => {
    if (comicId) {
      fetchComic(comicId);
    }
  }, [comicId]);

  const fetchComic = async (id: string) => {
    try {
      const response = await fetch(`/api/comics?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch comic');
      const data = await response.json();
      setFrames(data.frames);
      setShowComic(true);
    } catch (error) {
      console.error('Error fetching comic:', error);
    }
  };

  return null; // This component does not render anything
};

export default ComicFetcher; 