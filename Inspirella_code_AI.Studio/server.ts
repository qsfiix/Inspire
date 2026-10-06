import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Behind Railway/any reverse proxy, the real client address is in
// X-Forwarded-For - without this, req.ip is the proxy's own address and
// every visitor would share one rate-limit bucket.
app.set("trust proxy", 1);

app.use(express.json({ limit: "50kb" }));

// Fallback tokens from PDF to ensure robust out-of-the-box execution
const CONFIG = {
  SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID || "",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || "",
  MAPBOX_STYLE_URL: process.env.MAPBOX_STYLE_URL || ""
};

// API Route: Configuration sharing
app.get("/api/config", (req, res) => {
  res.json({
    supabaseProjectId: CONFIG.SUPABASE_PROJECT_ID,
    supabaseUrl: CONFIG.SUPABASE_URL,
    supabaseAnonKey: CONFIG.SUPABASE_ANON_KEY,
    mapboxAccessToken: CONFIG.MAPBOX_ACCESS_TOKEN,
    mapboxStyleUrl: CONFIG.MAPBOX_STYLE_URL
  });
});

/**
 * Minimal in-memory rate limiter for /api/gemini/advisor.
 *
 * This endpoint calls a paid, metered API and has no auth in front of it, so
 * it must not be reachable without limits once the server is public - see
 * 02_Product/Backend/Backend Overview.md ("Backend quality bar: rate limits,
 * validation, audit metadata"). A small local Map is deliberately preferred
 * over adding a dependency (04_Development/Dependencies.md): this only needs
 * to survive one process, not coordinate across instances.
 */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

// Periodically forget old buckets so this Map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitBuckets.delete(key);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

/** Caps array/string sizes so a malicious payload can't inflate the prompt or cost. */
function sanitizeAdvisorInput(body: any): { interests?: string[]; goals?: string[]; currentStage?: string; language: string } | null {
  if (!body || typeof body !== "object") return null;

  const asBoundedStringArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    return value
      .filter((item): item is string => typeof item === "string")
      .slice(0, 20)
      .map(item => item.trim().slice(0, 100))
      .filter(Boolean);
  };

  const asBoundedString = (value: unknown, maxLength: number): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim().slice(0, maxLength);
    return trimmed || undefined;
  };

  return {
    interests: asBoundedStringArray(body.interests),
    goals: asBoundedStringArray(body.goals),
    currentStage: asBoundedString(body.currentStage, 100),
    language: asBoundedString(body.language, 30) || "English"
  };
}

// Lazy-loaded Gemini AI client to prevent crash if key is unset
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "inspirella-server"
        }
      }
    });
  }
  return aiClient;
}

// API Route: AI-powered Educational Advisor
app.post("/api/gemini/advisor", async (req, res) => {
  if (isRateLimited(req.ip || "unknown")) {
    res.status(429).json({
      error: "rate_limited",
      message: "Too many advisor requests. Please try again in a few minutes."
    });
    return;
  }

  const sanitized = sanitizeAdvisorInput(req.body);
  if (!sanitized) {
    res.status(400).json({ error: "invalid_request", message: "Malformed request body." });
    return;
  }
  const { interests, goals, currentStage, language } = sanitized;

  try {
    const ai = getGeminiClient();
    
    const prompt = `You are a premium educational consultant at Inspirella.
Analyze the user's profile and provide structured educational paths and options in Switzerland.
User profile:
- Interests: ${interests ? interests.join(", ") : "general exploration"}
- Goals: ${goals ? goals.join(", ") : "understanding the Swiss education system"}
- Current Stage: ${currentStage || "Explorer / All ages"}
- Preferred Language: ${language}

Please write your response formatted as JSON. Return a JSON object with:
{
  "welcomeMessage": "A personal greeting addressing their context and motivations.",
  "suggestedPathTitle": "A highly premium, inspiring title for their custom Swiss path",
  "explanation": "A clean 2-3 sentence overview of their educational landscape in Switzerland.",
  "milestones": [
    {
      "id": "1",
      "title": "A short milestone action title",
      "description": "Specific Swiss education stage or option matching this milestone.",
      "timeframe": "Suggested timeline"
    }
  ],
  "recommendedInstitutions": [
    "Names of 2-3 genuine Swiss institutions, schools, or industries that match their profile"
  ]
}

Ensure the output is strictly valid JSON matching the schema above, and matches their preferred language (${language}). Address the user informally and warmly (German "du", French "tu", Italian "tu").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert, multilingual expert advisor for Switzerland's double-tracked educational system (academic & vocational)."
      }
    });

    const responseText = response.text || "";
    // Send back parsed JSON
    res.json(JSON.parse(responseText.trim()));
  } catch (error: any) {
    console.error("Gemini Advisor Error:", error);
    // Provide an elegant mock consultations fallback if key is missing or api fails
    res.json({
      welcomeMessage: `Herzlich willkommen! Based on your preference for ${language}, here is our bespoke consultation. Switzerland's double-tracked system offers perfect harmony between vocational apprenticeship (VET) and world-renowned academic routes.`,
      suggestedPathTitle: `Custom Educational Path: Swiss Elite Alignment`,
      explanation: "Swiss education is characterized by strong permeability (Durchlässigkeit) - any level can lead to another. This maximizes options for all stages of life.",
      milestones: [
        {
          "id": "1",
          "title": "Orientation & Canton Alignment",
          "description": "Align your interests with the local canton's office for vocational or academic counseling (BIZ / OPASP).",
          "timeframe": "Month 1"
        },
        {
          "id": "2",
          "title": "Bespoke Admissions Strategy",
          "description": "Prepare candidate files for academic admissions or secure an apprenticeship partner contract.",
          "timeframe": "Month 2-6"
        }
      ],
      recommendedInstitutions: [
        "ETH Zurich / EPFL Lausanne (Academic Elite)",
        "Swiss Vocational Training Institutes (Professional Competence)",
        "Inter-Canton Universities of Applied Sciences (Fachhochschulen)"
      ],
      isFallback: true,
      errorMessage: error.message || "An error occurred with the AI consultant."
    });
  }
});

// Structured error handler: Express's default error page includes a stack
// trace and local file paths (e.g. for a body-parser "payload too large"
// error), which must never reach a client response.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error("Unhandled request error:", err);
  const status = typeof err?.status === "number" ? err.status : 500;
  res.status(status).json({ error: "request_error", message: "The request could not be processed." });
});

// Serve Vite in dev or static in prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve SPA index.html for all routes in production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Inspirella server booted successfully on port ${PORT}`);
  });
}

startServer();
