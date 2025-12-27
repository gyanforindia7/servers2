import { GoogleGenAI } from "@google/genai";

// Initialize AI with the environment variable exclusively
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found in process.env.API_KEY");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductDescription = async (productName: string, brand: string, category: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional, enterprise-grade e-commerce product description for a ${brand} ${productName} in the ${category} category. 
      Focus on reliability, performance, and scalability. 
      Use HTML tags like <strong> and <ul> for formatting. 
      Keep it between 150-250 words.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "Failed to generate description.";
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};

export const generateSEOData = async (productName: string, description: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate SEO metadata for a product named "${productName}". 
      Description context: ${description.substring(0, 200)}...
      Return a JSON object with properties: metaTitle, metaDescription, and keywords (comma separated).`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI SEO Error:", error);
    return null;
  }
};
