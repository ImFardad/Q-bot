const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Op } = require('sequelize');
const UserQuestionHistory = require('../db/UserQuestionHistory');
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

async function generateQuestion(userId) {
  if (!model) return null;

  try {
    // 1. Clean up old questions for the user
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await UserQuestionHistory.destroy({
      where: {
        userId: userId,
        createdAt: {
          [Op.lt]: twentyFourHoursAgo,
        },
        type: 'general',
      },
    });

    // 2. Fetch recent questions for the user
    const recentQuestions = await UserQuestionHistory.findAll({
      where: { userId: userId, type: 'general' },
      order: [['createdAt', 'DESC']],
      limit: 20,
      attributes: ['question'],
    });
    const recentQuestionList = recentQuestions.map(item => `- ${item.question}`).join('\n');

    // 3. Create the dynamic prompt
    const prompt = `You are a question generation bot. Your only job is to provide a single, interesting, and DIVERSE general knowledge question in Persian.\n\nFollow these rules STRICTLY:\n1. The answer to the question MUST be short, ideally one to three words.\n2. Your response MUST contain ONLY the question text itself.\n3. Do NOT include any introductory text, the answer, or any hints.\n4. Most importantly, DO NOT ask any of the following questions that have been asked recently:\n${recentQuestionList.length > 0 ? recentQuestionList : '(No recent questions)'}\n\nNow, generate a new, unique question with a short answer that is NOT in the list above.`;

    // 4. Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();

  } catch (error) {
    console.error('Error in generateQuestion function:', error);
    return null;
  }
}

async function evaluateAnswer(question, userAnswer) {
  if (!model) return null;

  const prompt = `You are an AI assistant for evaluating answers. Your task is to determine if the user's answer to a given question is correct. If the answer is correct, return "1". If it is incorrect, return "0". Do not provide any other text or explanation.\n\nQuestion: "${question}"\nUser's Answer: "${userAnswer}"\n\nIs the user's answer correct?`;

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

async function generateMathQuestion(userId) {
  if (!model) return null;

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await UserQuestionHistory.destroy({
      where: {
        userId: userId,
        createdAt: { [Op.lt]: twentyFourHoursAgo },
        type: 'math',
      },
    });

    const recentQuestions = await UserQuestionHistory.findAll({
      where: { userId: userId, type: 'math' },
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['question'],
    });
    const recentQuestionList = recentQuestions.map(item => `- ${item.question}`).join('\n');

    const prompt = `You are a math question generation bot. Your only job is to provide a single, high-school level math equation in Persian that has a single, numerical solution.\n\nFollow these rules STRICTLY:\n1. The question must be an equation that can be solved for a single variable (e.g., x).\n2. The solution to the equation must be a single number (integer or a simple fraction).\n3. The difficulty should be appropriate for a high-school student. Examples: linear equations, quadratic equations with real roots, simple exponential equations.\n4. Avoid creating inequalities, systems of equations, or problems that result in a range of solutions.\n5. Your response MUST contain ONLY the equation itself. Do not include "solve for x", the answer, or any other text.\n6. Do NOT ask any of the following questions that have been asked recently:\n${recentQuestionList.length > 0 ? recentQuestionList : '(No recent questions)'}\n\nNow, generate a new, unique equation with a single numerical answer.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();

  } catch (error) {
    console.error('Error in generateMathQuestion function:', error);
    return null;
  }
}

async function evaluateMathAnswer(question, userAnswer) {
  if (!model) return null;

  const prompt = `You are an AI assistant for evaluating math answers. Your task is to determine if the user's numerical answer to a given equation is correct. The user will provide only a number.\n\nQuestion: "${question}"\nUser's Answer: "${userAnswer}"\n\nFirst, solve the equation for the variable. Second, compare your solution to the user's answer. If the user's answer is numerically correct (even if formatted differently), return "1". If it is incorrect, return "0". Do not provide any other text, explanation, or the correct answer.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (text === '1' || text === '0') {
      return text;
    }
    console.warn(`Unexpected response from Gemini math evaluation: "${text}". Defaulting to incorrect.`);
    return '0';

  } catch (error) {
    console.error('Error evaluating math answer with Gemini:', error);
    return null;
  }
}


module.exports = {
  generateQuestion,
  evaluateAnswer,
  generateMathQuestion,
  evaluateMathAnswer,
  isEnabled: !!model,
};