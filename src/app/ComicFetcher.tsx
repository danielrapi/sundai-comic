'use client';
import { useEffect } from "react";
import { useSearchParams } from 'next/navigation';

interface ComicFetcherProps {
  setFrames: (frames: Array<{ imageUrl: string; caption: string }>) => void;
  setShowComic: (show: boolean) => void;
}

const ComicFetcher: React.FC<ComicFetcherProps> = ({ setFrames, setShowComic }) => {
  const searchParams = useSearchParams();
  const comicId = searchParams.get('id');

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

  useEffect(() => {
    if (comicId) {
      fetchComic(comicId);
    }
  }, [comicId]);

  return null; // This component does not render anything
};

export default ComicFetcher; 