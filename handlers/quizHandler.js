const geminiService = require('../services/geminiService');
const UserQuestionHistory = require('../db/UserQuestionHistory');
const User = require('../db/User');

// Simple in-memory state for the quiz
const userQuizState = {};

async function startQuiz(bot, chatId, userId) {
  if (!geminiService.isEnabled) {
    bot.sendMessage(chatId, 'متاسفانه سرویس سوال در حال حاضر غیرفعال است. لطفاً بعداً تلاش کنید.');
    return;
  }

  bot.sendMessage(chatId, '⏳ در حال تولید یک سوال جدید...');

  const question = await geminiService.generateQuestion(userId);

  if (question) {
    // Store the question and type in the user's state
    userQuizState[chatId] = { question: question, type: 'general' };
    
    // Save the question to the history
    try {
      await UserQuestionHistory.create({
        question: question,
        userId: userId,
        type: 'general',
      });
    } catch (error) {
      console.error('Failed to save question to history:', error);
    }

    bot.sendMessage(chatId, `سوال شما:\n\n🤔 **${question}**\n\nپاسخ خود را ارسال کنید.`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, 'خطایی در تولید سوال رخ داد. لطفاً دوباره تلاش کنید.');
  }
}

async function startMathQuiz(bot, chatId, userId) {
  if (!geminiService.isEnabled) {
    bot.sendMessage(chatId, 'متاسفانه سرویس سوال در حال حاضر غیرفعال است. لطفاً بعداً تلاش کنید.');
    return;
  }

  bot.sendMessage(chatId, '⏳ در حال تولید یک سوال ریاضی...');

  const question = await geminiService.generateMathQuestion(userId);

  if (question) {
    // Store the question and type in the user's state
    userQuizState[chatId] = { question: question, type: 'math' };
    
    // Save the question to the history
    try {
      await UserQuestionHistory.create({
        question: question,
        userId: userId,
        type: 'math',
      });
    } catch (error) {
      console.error('Failed to save math question to history:', error);
    }

    bot.sendMessage(chatId, `معادله زیر را حل کنید:\n\n🧮 **${question}**\n\nپاسخ خود را (فقط عدد نهایی) ارسال کنید.`, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId, 'خطایی در تولید سوال ریاضی رخ داد. لطفاً دوباره تلاش کنید.');
  }
}

async function handleQuizAnswer(bot, msg) {
  const chatId = msg.chat.id;
  const state = userQuizState[chatId];

  // Check if the user was expecting to answer a question
  if (state && state.question) {
    const userAnswer = msg.text;
    const question = state.question;
    const type = state.type;

    // Clear state immediately
    delete userQuizState[chatId];

    bot.sendMessage(chatId, '🧐 در حال بررسی پاسخ شما...');

    let result;
    if (type === 'math') {
      result = await geminiService.evaluateMathAnswer(question, userAnswer);
    } else {
      result = await geminiService.evaluateAnswer(question, userAnswer);
    }

    let resultText;
    if (result === '1') {
      try {
        const user = await User.findByPk(msg.from.id);
        if (user) {
          user.score += 10;
          await user.save();
          resultText = `✅ آفرین! پاسخ شما صحیح بود.\n\n💰 امتیاز شما: ${user.score}`;
        } else {
          resultText = '✅ آفرین! پاسخ شما صحیح بود.';
        }
      } catch (error) {
        console.error('Failed to update user score:', error);
        resultText = '✅ آفرین! پاسخ شما صحیح بود.';
      }
    } else if (result === '0') {
      resultText = '❌ متاسفانه پاسخ شما صحیح نبود.';
    } else {
      resultText = 'خطایی در بررسی پاسخ شما رخ داد.';
    }

    // Send the result in a new message with a back button
    await bot.sendMessage(chatId, resultText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ بازگشت به منوی اصلی', callback_data: 'navigate:main' }]
        ]
      }
    });
    
    return true; // Message was handled
  }

  return false; // Message was not a quiz answer
}

module.exports = { startQuiz, startMathQuiz, handleQuizAnswer };