import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load .env.local first (if present for local secrets), then .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// // Helper to get GoogleGenAI instance
// function getAIClient(customKey?: string) {
//   const keyToUse =
//     (customKey && typeof customKey === 'string' && customKey.trim()) ||
//     process.env.GEMINI_API_KEY;

//   if (!keyToUse) return null;

//   return new GoogleGenAI({
//     apiKey: keyToUse,
//     httpOptions: {
//       headers: {
//         'User-Agent': 'aistudio-build',
//       },
//     },
//   });
// }

// Helper to get GoogleGenAI instance with custom options
function getAIClient(customKey?: string) {
  const keyToUse =
    (customKey && typeof customKey === "string" && customKey.trim()) ||
    process.env.GEMINI_API_KEY;

  if (!keyToUse) return null;

  return new GoogleGenAI({
    apiKey: keyToUse,
    // အကယ်၍ proxy သို့မဟုတ် custom endpoint သုံးမည်ဆိုပါက base URL ထည့်နိုင်သည်
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
        // လိုအပ်ပါက region သို့မဟုတ် proxy header များကို ဤနေရာတွင် ထည့်သွင်းနိုင်သည်
      },
    },
  });
}
// 1. API route for Gemini Burmese TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, apiKey, voiceName = "Kore" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    const ai = getAIClient(apiKey);
    if (!ai) {
      return res.status(400).json({
        error: "Gemini API Key is not configured.",
      });
    }

    const promptText = `Speak the following Burmese text clearly in natural, warm, and authentic Burmese (Myanmar) language:\n\n${text.trim()}`;

    const modelsToTry = [
      "gemini-3.8-flash-lite-tts",
      "gemini-3.8-flash-tts",
      "gemini-2.5-flash-preview-tts",
      "gemini-2.5-flash",
    ];

    let audioData: string | undefined;
    let mimeType = "audio/wav";
    let modelUsed = "";
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [{ text: promptText }],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
          audioData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "audio/wav";
          modelUsed = model;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} TTS attempt failed:`, err?.message || err);
      }
    }

    if (!audioData) {
      const errorMessage = lastError?.message || "No audio returned by Gemini";
      return res.status(500).json({ error: errorMessage });
    }

    return res.json({
      success: true,
      audioData,
      mimeType,
      modelUsed,
    });
  } catch (error: any) {
    console.error("Server TTS error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to generate speech with Gemini",
    });
  }
});

// 2. API route to parse natural language voice text into a structured Burmese task
app.post("/api/parse-task", async (req, res) => {
  try {
    const { text, today = new Date().toISOString().split("T")[0] } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required to parse task" });
    }

    const ai = getAIClient();

    // If Gemini client is available, use Gemini 3.8 Flash for intelligent extraction
    if (ai) {
      try {
        const prompt = `You are an expert multilingual AI assistant for a Burmese Daily Reminder App.
The user spoke or entered this Burmese voice task: "${text.trim()}".
Today's local date is: ${today}.

Extract and schedule the task accurately.
Return ONLY a valid JSON object with NO surrounding markdown backticks:
{
  "title": "Clean, concise task title in Burmese script (e.g. 'ရုံးအစည်းအဝေး တက်ရောက်ရန်', 'ရေသောက်ရန်', 'ဆေးသောက်ရန်')",
  "date": "YYYY-MM-DD (e.g. today '${today}', or tomorrow if user said 'မနက်ဖြန်'/'နောက်နေ့', or specific date)",
  "time": "HH:mm in 24-hour format (e.g. '09:00' for 9 AM, '14:30' for 2:30 PM, '17:00' for 5 PM, '20:00' for 8 PM; default to '12:00' if no time mentioned)",
  "category": "Exactly one of: 'အလုပ်' | 'ကိုယ်ရေးကိုယ်တာ' | 'ကျန်းမာရေး' | 'ပညာရေး'",
  "priority": "Exactly one of: 'high' | 'medium' | 'low'",
  "ttsMessage": "A natural, polite Burmese reminder sentence to speak aloud when the alarm triggers (e.g. 'ရုံးအစည်းအဝေး တက်ရောက်ရန် အချိန်ကျရောက်ပါပြီ')"
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawJson = response.text?.trim() || "";
        const parsed = JSON.parse(rawJson);

        if (parsed.title) {
          return res.json({
            success: true,
            task: {
              title: parsed.title,
              date: parsed.date || today,
              time: parsed.time || "12:00",
              category: parsed.category || "ကိုယ်ရေးကိုယ်တာ",
              priority: parsed.priority || "medium",
              ttsMessage:
                parsed.ttsMessage ||
                `${parsed.title} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
            },
          });
        }
      } catch (aiErr) {
        console.warn("Gemini parse error, using heuristic fallback:", aiErr);
      }
    }

    // Heuristic Fallback
    const fallback = heuristicParseBurmeseTask(text, today);
    return res.json({
      success: true,
      task: fallback,
    });
  } catch (error: any) {
    console.error("Task parse error:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Failed to parse task" });
  }
});

// 3. API route to transcribe audio file (MediaRecorder webm/wav) using Gemini Multimodal Audio
app.post("/api/transcribe-audio", async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = "audio/webm",
      today = new Date().toISOString().split("T")[0],
    } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Audio data is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res
        .status(400)
        .json({ error: "Gemini API Key is not configured on server" });
    }

    const prompt = `The user recorded an audio voice note in Burmese to add a daily task reminder.
Today's local date is: ${today}.

1. Listen to the audio and transcribe the spoken words accurately into clean Myanmar Unicode script.
2. Extract the task details (title, date, time, category, priority, and ttsMessage).

Return ONLY a valid JSON object matching this schema:
{
  "transcript": "Exact transcription in Myanmar Unicode script",
  "task": {
    "title": "Clean, concise Burmese task title",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "category": "အလုပ်" or "ကိုယ်ရေးကိုယ်တာ" or "ကျန်းမာရေး" or "ပညာရေး",
    "priority": "high" or "medium" or "low",
    "ttsMessage": "Burmese spoken reminder sentence"
  }
}`;

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: mimeType.split(";")[0] || "audio/webm",
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [audioPart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawJson = response.text?.trim() || "";
    const parsed = JSON.parse(rawJson);

    return res.json({
      success: true,
      transcript: parsed.transcript || "",
      task:
        parsed.task ||
        heuristicParseBurmeseTask(parsed.transcript || "", today),
    });
  } catch (error: any) {
    console.error("Audio transcription error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to transcribe audio with Gemini",
    });
  }
});

function heuristicParseBurmeseTask(input: string, today: string) {
  let title = input.trim();
  let date = today;
  let time = "12:00";
  let category = "ကိုယ်ရေးကိုယ်တာ";
  let priority: "high" | "medium" | "low" = "medium";

  const lower = input.toLowerCase();

  // Date detection
  if (lower.includes("မနက်ဖြန်") || lower.includes("နောက်နေ့")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    date = d.toISOString().split("T")[0];
  } else if (lower.includes("သဘက်ခါ")) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    date = d.toISOString().split("T")[0];
  }

  // Time detection
  if (lower.includes("မနက် ၆") || lower.includes("၆ နာရီခွဲ")) time = "06:00";
  else if (lower.includes("မနက် ၇") || lower.includes("၇ နာရီ")) time = "07:00";
  else if (lower.includes("မနက် ၈") || lower.includes("၈ နာရီ")) time = "08:00";
  else if (lower.includes("မနက် ၉") || lower.includes("၉ နာရီ")) time = "09:00";
  else if (lower.includes("မနက် ၁၀") || lower.includes("၁၀ နာရီ"))
    time = "10:00";
  else if (lower.includes("မနက် ၁၁") || lower.includes("၁၁ နာရီ"))
    time = "11:00";
  else if (lower.includes("နေ့လယ် ၁၂") || lower.includes("၁၂ နာရီ"))
    time = "12:00";
  else if (lower.includes("မွန်းလွဲ ၁") || lower.includes("၁ နာရီ"))
    time = "13:00";
  else if (lower.includes("မွန်းလွဲ ၂") || lower.includes("၂ နာရီ"))
    time = "14:00";
  else if (lower.includes("မွန်းလွဲ ၃") || lower.includes("၃ နာရီ"))
    time = "15:00";
  else if (lower.includes("ညနေ ၄") || lower.includes("၄ နာရီ")) time = "16:00";
  else if (lower.includes("ညနေ ၅") || lower.includes("၅ နာရီ")) time = "17:00";
  else if (lower.includes("ည ၇") || lower.includes("၇ နာရီ")) time = "19:00";
  else if (lower.includes("ည ၈") || lower.includes("၈ နာရီ")) time = "20:00";
  else if (lower.includes("ည ၉") || lower.includes("၉ နာရီ")) time = "21:00";

  // Category detection
  if (
    lower.includes("အလုပ်") ||
    lower.includes("ရုံး") ||
    lower.includes("အစည်းအဝေး") ||
    lower.includes("ပရောဂျက်")
  ) {
    category = "အလုပ်";
  } else if (
    lower.includes("ဆေး") ||
    lower.includes("ရေသောက်") ||
    lower.includes("ကျန်းမာ") ||
    lower.includes("လေ့ကျင့်ခန်း") ||
    lower.includes("လမ်းလျှောက်")
  ) {
    category = "ကျန်းမာရေး";
  } else if (
    lower.includes("စာအုပ်") ||
    lower.includes("စာဖတ်") ||
    lower.includes("သင်တန်း") ||
    lower.includes("ကျောင်း") ||
    lower.includes("လေ့လာ")
  ) {
    category = "ပညာရေး";
  }

  // Priority detection
  if (
    lower.includes("အရေးကြီး") ||
    lower.includes("အရေးပေါ်") ||
    lower.includes("မဖြစ်မနေ")
  ) {
    priority = "high";
  }

  return {
    title: title || "အသံဖြင့် ထည့်သွင်းထားသော တာဝန်",
    date,
    time,
    category,
    priority,
    ttsMessage: `${title || "တာဝန်"} ပြုလုပ်ရန် အချိန်ကျရောက်ပါပြီ`,
  };
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasEnvKey: !!process.env.GEMINI_API_KEY,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
