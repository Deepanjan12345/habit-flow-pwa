import { GoogleGenAI } from "@google/genai";

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simple global state to track if we've hit a quota limit recently
let lastQuotaErrorTime = 0;
const QUOTA_COOLDOWN = 60000; // 1 minute cooldown before trying again after a 429

async function withRetry<T>(fn: () => Promise<T>, fallback: T, retries = 2, initialDelay = 1000): Promise<T> {
  // If we hit a quota error very recently, don't even try the API to avoid further rate limiting
  if (Date.now() - lastQuotaErrorTime < QUOTA_COOLDOWN) {
    return fallback;
  }

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const status = error?.status || error?.error?.code;
      
      if (status === 429) {
        lastQuotaErrorTime = Date.now();
        // Quota errors (Resource Exhausted) usually aren't resolved by immediate retries
        // We'll try at most once more after a short delay, then bail to fallback
        if (i < 1) {
          const waitTime = initialDelay + (Math.random() * 500);
          console.warn(`Gemini API: Quota reached (429). Retrying once in ${Math.round(waitTime)}ms...`);
          await delay(waitTime);
          continue;
        }
        break; 
      }
      
      // For 5xx Server Errors, use exponential backoff
      if (status >= 500 && status <= 599) {
        const waitTime = (initialDelay * Math.pow(2, i)) + (Math.random() * 500);
        await delay(waitTime);
        continue;
      }
      // For other client errors (400, 401, 403, 404), don't retry
      break;
    }
  }
  
  // Log a concise error instead of the whole object
  if (lastError?.status === 429 || lastError?.error?.code === 429) {
    console.warn("Gemini API: Quota exhausted (429). Using fallback content.");
  } else {
    console.error("Gemini API Error:", lastError?.message || "Unexpected error");
  }
  
  return fallback;
}

const QUOTE_FALLBACKS = [
  "Consistency is the key. Aaj thoda, kal zyada!",
  "Small steps lead to big changes. Lage raho!",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future self will thank you for what you do today.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Mera kal aaj se behtar hoga, kyunki aaj maine mehnat ki hai.",
  "Success isn't always about greatness. It's about consistency.",
  "Habits are the compound interest of self-improvement.",
  "Don't wait for motivation. Build discipline.",
  "Be better than you were yesterday.",
  "Zindagi mein consistency hi asli power hai.",
  "Focus on the process, not just the result."
];

const NUDGE_FALLBACKS = [
  "You're doing great! Keep the momentum going.",
  "Focus on just one small task today to keep the streak alive.",
  "Consistency is a marathon, not a sprint. Take it easy but don't stop.",
  "Tiny habits, massive results. Keep flowing!",
  "Remember why you started. One more step today!",
  "Ek choti si shuruat, bade badlav ki wajah banti hai.",
  "Consistency check: Have you done your most important habit today?",
  "Small wins are still wins. Keep that streak glowing!",
  "Even a 2-minute effort keeps the identity alive.",
  "Don't let a miss become a trend. Show up today!"
];

export const fetchDailyQuote = async (): Promise<string> => {
  const randomFallback = QUOTE_FALLBACKS[Math.floor(Math.random() * QUOTE_FALLBACKS.length)];
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Give one short uplifting quote in Hindi-English mix about discipline and habits, max 15 words. Keep it natural and motivating. No hashtags.',
    });
    return response.text?.trim() || randomFallback;
  }, randomFallback);
};

export const fetchPredictiveNudge = async (summary: string): Promise<string> => {
  const randomFallback = NUDGE_FALLBACKS[Math.floor(Math.random() * NUDGE_FALLBACKS.length)];
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: [${summary}]. Task: Generate ONE short habit coach nudge (max 20 words) suggesting a tiny adjustment. Encouraging, no guilt.`,
    });
    return response.text?.trim() || randomFallback;
  }, randomFallback);
};

export const fetchReflectionInsight = async (logsSummary: string, mood: number, note: string): Promise<string> => {
  const defaultInsight = "Reflection completed. Every day is a step forward!";
  return withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Logs: [${logsSummary}]. Mood: ${mood}/5. Note: "${note}". Generate a 1-sentence observation about how their habits might be affecting their energy.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || defaultInsight;
  }, defaultInsight);
};