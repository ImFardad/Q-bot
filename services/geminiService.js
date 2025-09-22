const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
let genAI;
let model;

if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    const generationConfig = { temperature: 0.9 };
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig });
  } catch (error) {
    console.error('Could not initialize Gemini AI. Please check your API key.', error);
    model = null;
  }
} else {
  console.warn('GEMINI_API_KEY is not set in .env file. Quiz feature will be disabled.');
}

async function generateQuestion() {
  if (!model) return null;

  const prompt = `You are a question generation bot. Your only job is to provide a single, interesting, and DIVERSE general knowledge question in Persian.

Follow these rules STRICTLY:
1. The answer to the question MUST be short, ideally one to three words (e.g., a specific name, place, year, or term).
2. Your response MUST contain ONLY the question text itself.
3. Do NOT repeat questions. Ask from a wide range of categories (science, history, geography, art).
4. Do NOT include any introductory text, the answer, or any hints.

GOOD question example (short answer):
"بلندترین قله جهان چه نام دارد?"

BAD question example (long answer):
"قانون دوم نیوتن را توضیح دهید."

Now, generate a new, unique question with a short answer.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error('Error generating question from Gemini:', error);
    return null;
  }
}

async function evaluateAnswer(question, userAnswer) {
  if (!model) return null;

  const prompt = `You are an AI assistant for evaluating answers. Your task is to determine if the user's answer to a given question is correct. If the answer is correct, return "1". If it is incorrect, return "0". Do not provide any other text or explanation.

Question: "${question}"
User's Answer: "${userAnswer}"

Is the user's answer correct?`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    if (text === '1' || text === '0') {
      return text;
    }
    console.warn(`Unexpected response from Gemini evaluation: "${text}". Defaulting to incorrect.`);
    return '0';

  } catch (error) {
    console.error('Error evaluating answer with Gemini:', error);
    return null;
  }
}

module.exports = { generateQuestion, evaluateAnswer, isEnabled: !!model };
