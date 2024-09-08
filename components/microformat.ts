interface MicroFormat {
  "@context": string;
  "@type": string;
  description: string;
  duration: string;
  embedUrl: string;
  interactionCount: string;
  name: string;
  thumbnailUrl: string[];
  uploadDate: string;
  genre: string;
  author: string;
  publication?: Publication[];
}

interface Publication {
  "@type": string;
  isLiveBroadcast: boolean;
  startDate: string;
  endDate?: string;
}

// parse microformat from script tag
export function parseMicroformat(el: Element): MicroFormat | null {
  const script = el.querySelector("script");
  const textContent = script?.textContent;
  if (!textContent) return null;

  try {
    return JSON.parse(textContent);
  } catch (e) {
    console.error(e);
    return null;
  }
}

// Convert timeText to seconds
export function timeToSec(time: string) {
  const [sec, min, hour] = time.split(":").reverse();
  return Number(hour ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(sec ?? 0);
}
