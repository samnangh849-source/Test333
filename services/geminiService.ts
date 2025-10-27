
import { GoogleGenAI } from "@google/genai";

export const summarizeText = async (ai: GoogleGenAI, text: string): Promise<string> => {
    if (!text) return "No text provided to summarize.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Summarize the following note concisely for an order overview: "${text}"`,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini summarization error:", error);
        return "Could not generate summary.";
    }
};

export const generateProductDescription = async (ai: GoogleGenAI, productName: string): Promise<string> => {
    if (!productName) return "";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a short, appealing product description in Khmer for a product named "${productName}".`,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini description generation error:", error);
        return "";
    }
};

export const analyzeReportData = async (ai: GoogleGenAI, reportData: any): Promise<string> => {
     try {
        const prompt = `
            Analyze the following sales report data and provide a brief summary of key insights in Khmer.
            Focus on overall performance (revenue, profit), monthly trends for the current year, and top expense categories (by company and driver).
            
            Data:
            Yearly Summary: ${JSON.stringify(reportData.yearly)}
            Monthly Summary (Current Year): ${JSON.stringify(reportData.monthly)}
            Expenses by Shipping Company: ${JSON.stringify(reportData.byCompany)}
            Expenses by Driver: ${JSON.stringify(reportData.byDriver)}

            Provide a bulleted list of insights.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error("Gemini report analysis error:", error);
        return "Could not generate analysis from Gemini.";
    }
};