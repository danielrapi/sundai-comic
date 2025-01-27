import { NextResponse } from 'next/server';
import Replicate from "replicate";
import OpenAI from 'openai';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.GITHUB_TOKEN,
  baseURL: "https://models.inference.ai.azure.com"
});

async function generateFrameDescriptions(prompt: string, frameCount: number): Promise<any> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
            Create a fun, lighthearted ${frameCount}-panel comic story about Liska. The story should be humorous and playful, 
            incorporating elements of silly situations, funny misunderstandings, or amusing everyday moments.
            Think along the lines of Calvin & Hobbes or Garfield's style of humor, but appropriate for all ages.

            For each panel, provide:
            1. An image generation prompt that includes 'Liska' and must end with these exact style specifications:
               ", realistic photo, soft lighting, cinematic composition, 4k, high quality, consistent style, natural colors"
            2. A caption that refers to the girl as 'Liska' and includes a touch of humor or whimsy

            The prompts should:
            - Maintain visual consistency across all panels
            - Use similar lighting descriptions
            - Keep Liska's appearance consistent throughout the story
            - Include expressive facial expressions and body language to convey humor
            - Add fun, lighthearted elements to the scenes
            - Incorporate playful situations and reactions

            Format the output as JSON with this structure:
            {
                "comics": [
                    {
                        "prompt": "Image generation prompt here + style specifications",
                        "caption": "Humorous caption text here"
                    }
                ]
            }
            `
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.8,  // Slightly increased for more creative variations
  });

  const content = response.choices[0]?.message?.content;
  console.log(content);
  if (!content) throw new Error('Failed to generate frame descriptions');
  
  return JSON.parse(content);
}

async function generateImage(prompt: string) {
  const output = await replicate.run(
    "danielrapi/liska_model:b2d282372a92977c6917c5384be0e9cf05f9a1a1cc50844211f9a2f71aedef12",
    {
      input: {
        prompt: prompt,
        model: "dev",
        useFileOutput: false,
        stream: false
      }
    }
  ) as unknown[];

  const imageData = output[0];
  if (!(imageData instanceof ReadableStream)) {
    throw new Error('Expected ReadableStream');
  }

  const reader = imageData.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const concatenated = new Uint8Array(chunks.flatMap(chunk => Array.from(chunk)));
  const base64Image = Buffer.from(concatenated).toString('base64');
  return `data:image/webp;base64,${base64Image}`;
}

export async function POST(request: Request) {
  try {
    const { prompt, frameCount } = await request.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required and must be a string' }), 
        { status: 400 }
      );
    }

    if (!frameCount || typeof frameCount !== 'number' || frameCount < 1 || frameCount > 8) {
      return new Response(
        JSON.stringify({ error: 'Frame count must be a number between 1 and 8' }), 
        { status: 400 }
      );
    }

    // First, generate the comic descriptions
    const storyData = await generateFrameDescriptions(prompt, frameCount);
    
    // Then, generate images for each frame
    const frames = await Promise.all(
      storyData.comics.map(async (frame: { prompt: string, caption: string }) => {
        const imageUrl = await generateImage(frame.prompt);
        return {
          ...frame,
          imageUrl
        };
      })
    );

    return NextResponse.json({ frames });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }), 
      { status: 500 }
    );
  }
}
