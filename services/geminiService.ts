import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchMusicWithGemini = async (query: string): Promise<Song[]> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a list of 8 real songs that match this search query or mood: "${query}". 
      Return a JSON array. 
      For 'duration', ensure it is in "MM:SS" format (e.g., "3:45").
      For 'coverDescription', provide a concise, creative visual description of the album art (e.g. "abstract geometric neon shapes", "band photo in alleyway black and white").
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              coverDescription: { type: Type.STRING },
              duration: { type: Type.STRING },
            },
            required: ["title", "artist", "album", "coverDescription", "duration"]
          }
        }
      }
    });

    if (response.text) {
      const rawSongs = JSON.parse(response.text) as any[];
      
      return rawSongs.map((s, i) => {
        // Parse and normalize duration
        const parts = s.duration.includes(':') ? s.duration.split(':') : ['0', '0'];
        const minutes = parseInt(parts[0] || '0', 10);
        const seconds = parseInt(parts[1] || '0', 10);
        
        const durationSec = (minutes * 60) + seconds;
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Generate specific album art URL using Pollinations
        // We add specific keywords to ensure good style
        const prompt = encodeURIComponent(`${s.coverDescription} ${s.album} album cover, high quality, 4k`);
        // Using a random seed based on song info to keep it consistent for the same result but different for others
        const coverUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`;

        return {
          id: `gemini-${Date.now()}-${i}`,
          title: s.title,
          artist: s.artist,
          album: s.album,
          coverUrl: coverUrl,
          duration: formattedDuration,
          durationSec: durationSec,
          // Fallback audio for demo
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};

export const getSongLyrics = async (title: string, artist: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Return the lyrics for the song "${title}" by "${artist}".
      Return ONLY the lyrics as plain text with standard line breaks.
      Do not include the title or artist in the response headers.
      Do not include "Lyrics:" or any intro/outro text.
      If it is an instrumental song, return "[Instrumental]".
      If you cannot find the exact lyrics, generate plausible lyrics that fit the song's theme and style.`,
    });
    return response.text || "Lyrics not available.";
  } catch (e) {
    console.error("Gemini Lyrics Error:", e);
    return "Could not load lyrics. Please try again.";
  }
};

export const getAiGreeting = async (): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Give me a short, cool, 3-word greeting for a music app user based on the current time of day. No quotes.",
    });
    return response.text || "Welcome Back";
  } catch (e) {
    return "Welcome Back";
  }
};