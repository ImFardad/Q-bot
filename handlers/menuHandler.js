const { menus } = require('../keyboards/inlineKeyboards');
const { startQuiz } = require('./quizHandler');
const { handleStart } = require('./startHandler');

// This handler is now simplified to always send a new message for any navigation.
function handleMenuCallback(bot, callbackQuery) {
  const queryData = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const user = callbackQuery.from;

  bot.answerCallbackQuery(callbackQuery.id);

  if (queryData.startsWith('navigate:')) {
    const menuName = queryData.split(':')[1];
    
    if (menuName === 'main') {
      // Reuse the start handler to send a fresh main menu
      handleStart(bot, { chat: { id: chatId }, from: user });
      return;
    }

    const targetMenu = menus[menuName];
    if (targetMenu) {
      bot.sendMessage(chatId, targetMenu.text, targetMenu.options);
    }

  } else if (queryData.startsWith('action:')) {
    const actionName = queryData.split(':')[1];
    if (actionName === 'start_quiz') {
      // The messageId is no longer passed as we are not editing messages.
      startQuiz(bot, chatId);
    }
  }
}

module.exports = { handleMenuCallback };
