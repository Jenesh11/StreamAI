const API_KEY = process.env.API_KEY; // Using the same key. Ensure YouTube Data API v3 is enabled on this key.
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export const searchYouTubeVideo = async (query: string): Promise<string | null> => {
  if (!API_KEY) {
      console.error("AIzaSyAcAkn2icPvlYUwKbECpn4F87J8AfMXO04");
      return null;
  }

  try {
    // Search for the video
    const searchResponse = await fetch(
      `${YOUTUBE_API_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${API_KEY}`
    );

    if (!searchResponse.ok) {
        const err = await searchResponse.json();
        console.error("YouTube API Error:", err);
        return null;
    }

    const data = await searchResponse.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].id.videoId;
    }
    
    return null;
  } catch (error) {
    console.error("YouTube Search Exception:", error);
    return null;
  }
};

// Generate a direct thumbnail if we don't have one
export const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
