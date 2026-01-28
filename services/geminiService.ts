
import { GoogleGenAI } from "@google/genai";
import { ActivityReport } from "../types";

// Always use the named parameter for apiKey and use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  analyzeReports: async (reports: ActivityReport[]): Promise<string> => {
    if (reports.length === 0) return "No data available for analysis.";

    const reportSummary = reports.slice(0, 10).map(r => 
      `- ${r.date} (${r.timeFrom}-${r.timeTo}): ${r.courseId} at ${r.location || 'unspecified'}. Total trainees: ${r.grandTotal} (M:${r.totalMale}, F:${r.totalFemale}). Topics: ${r.topics}. Instructor: ${r.instructor}.`
    ).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Act as a High-Level Training Operations Analyst for a security academy. 
          Analyze the following detailed training reports and provide a insightful professional summary.
          Highlight:
          1. Demographic distribution (gender balance).
          2. Instructional coverage and topic variety.
          3. Training density and suggestions for operational improvement.
          
          Reports:
          ${reportSummary}
        `,
      });

      // response.text is a property, not a method.
      return response.text || "Unable to generate analysis at this time.";
    } catch (error) {
      console.error("Gemini analysis error:", error);
      return "Analysis failed. Please check your network connection.";
    }
  }
};
