import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";

export const google = createGoogleGenerativeAI({
	apiKey: process.env.GEMINI_API_KEY ?? "",
});

export const googleGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
