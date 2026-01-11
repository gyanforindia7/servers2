/**
 * PRODUCTION AI SERVICE
 * To ensure maximum security, all AI requests are now proxied through the backend.
 * This prevents the Gemini API Key from being visible in 'Inspect' mode.
 */

export const generateProductDescription = async (productName: string, brand: string, category: string): Promise<string> => {
  try {
    const response = await fetch('/api/ai/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, brand, category })
    });
    
    if (!response.ok) throw new Error("AI Backend failed");
    const data = await response.json();
    return data.text || "Failed to generate description.";
  } catch (error) {
    console.error("AI Proxy Error:", error);
    throw error;
  }
};

export const generateSEOData = async (productName: string, description: string) => {
  try {
    const response = await fetch('/api/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, description })
    });
    
    if (!response.ok) throw new Error("AI Backend failed");
    return await response.json();
  } catch (error) {
    console.error("AI Proxy SEO Error:", error);
    return null;
  }
};