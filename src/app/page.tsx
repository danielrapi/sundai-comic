'use client';
import Image from "next/image";
import { useState, Suspense } from "react";
import { useRouter } from 'next/navigation';
import ComicFetcher from "./ComicFetcher"; // Import the new component

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [showComic, setShowComic] = useState(false);
  const [progressStage, setProgressStage] = useState<'story' | 'frames'>('story');
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<Array<{imageUrl: string, caption: string}>>([]);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setProgressStage('story');
    
    // Faster initial progress increment (0-40%)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 20) return prev + 0.8; // Faster initial progress
        if (prev < 35) return prev + 0.4; // Slightly slower as we approach 40%
        return prev;
      });
    }, 200); // Reduced interval time for smoother animation

    const formData = new FormData(e.currentTarget);
    const storyline = formData.get('storyline');
    const frameCount = parseInt(formData.get('frames')?.toString() || '3');
    
    console.log('Submitting with frame count:', frameCount); // Debug log
    
    if (!storyline) {
      console.error('Storyline is required');
      setIsLoading(false);
      return;
    }
    
    if (frameCount < 1 || frameCount > 8) {
      console.error('Frame count must be between 1 and 8');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: storyline.toString(),
          frameCount: frameCount
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate image');
      }
      
      clearInterval(progressInterval);
      setProgress(40); // Set to 40% after story generation
      setProgressStage('frames');
      
      const data = await response.json();
      
      // Store the comic and get an ID
      const storeResponse = await fetch('/api/comics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const { id } = await storeResponse.json();
      
      // Frame generation progress (40-90%)
      const progressPerFrame = 50 / data.frames.length; // Adjusted for new range
      
      // Process frames and update progress
      for (let i = 0; i < data.frames.length; i++) {
        setProgress(40 + ((i + 1) * progressPerFrame));
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Final processing (90-100%)
      setProgress(90);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(95);
      await new Promise(resolve => setTimeout(resolve, 300));
      setProgress(100);
      
      // Update URL with comic ID
      router.push(`/?id=${id}`);
      
      setFrames(data.frames);
      setShowComic(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComicFetcher setFrames={setFrames} setShowComic={setShowComic} />
      <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-4xl font-bold">👩🏽 Liska Comic Maker</h1>
        </header>

        <main className="flex flex-col items-center justify-center">
          {!isLoading && !showComic ? (
            <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
              <div className="space-y-2">
                <label htmlFor="storyline" className="block text-sm font-medium">
                  Your Story
                </label>
                <textarea
                  id="storyline"
                  name="storyline"
                  required
                  className="w-full p-3 border rounded-lg bg-background border-foreground/10 min-h-[120px]"
                  placeholder="Enter your comic storyline or topic..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="frames" className="block text-sm font-medium">
                  Number of Frames (1-8)
                </label>
                <input
                  type="number"
                  id="frames"
                  name="frames"
                  required
                  min="1"
                  max="8"
                  defaultValue="4"
                  className="w-full p-3 border rounded-lg bg-background border-foreground/10"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] h-12 px-5"
              >
                Create Comic
              </button>
            </form>
          ) : isLoading ? (
            <div className="w-full max-w-2xl space-y-4">
              <div className="h-2 w-full bg-foreground/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center">
                {progressStage === 'story' 
                  ? "Creating your story..." 
                  : "Generating comic frames..."} {Math.round(progress)}%
              </p>
            </div>
          ) : (
            <div className="w-full max-w-4xl">
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowComic(false);
                    setFrames([]);
                  }}
                  className="mb-4 text-sm underline hover:no-underline"
                >
                  ← Create another comic
                </button>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                  frames.length <= 3 ? 'lg:grid-cols-3' : 
                  frames.length === 4 ? 'lg:grid-cols-2' :
                  frames.length >= 5 ? 'lg:grid-cols-3' : ''
                } ${frames.length === 5 ? 'lg:max-w-5xl lg:mx-auto' : ''}`}>
                  {frames.map((frame, index) => (
                    <div key={index} className="space-y-2">
                      <div className="aspect-square relative rounded-lg overflow-hidden">
                        <Image
                          src={frame.imageUrl}
                          alt={`Comic frame ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-sm text-center">{frame.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="flex gap-6 flex-wrap items-center justify-center text-sm">
          <p>Made with ❤️ for Liska</p>
        </footer>
      </div>
    </Suspense>
  );
}
