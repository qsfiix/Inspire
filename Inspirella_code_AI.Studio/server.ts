import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// API Route: AI-powered Educational Advisor
app.post("/api/gemini/advisor", async (req, res) => {
  const { interests, goals, currentStage, language = "English" } = req.body;

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

Ensure the output is strictly valid JSON matching the schema above, and matches their preferred language (${language}).`;

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
