import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get the gemini-pro model
const model: GenerativeModel = genAI.getGenerativeModel({ model: 'gemini-pro' });

/**
 * Generate AI response using Gemini
 * @param prompt - The input prompt for the AI
 * @returns The generated text response
 */
export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default model;
