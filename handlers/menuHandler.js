const { menus } = require('../keyboards/inlineKeyboards');
const { startQuiz } = require('./quizHandler');
const { handleStart } = require('./startHandler');
const { adminId } = require('../config');
const UserQuestionHistory = require('../db/UserQuestionHistory');
const _ = require('lodash');

async function handleMenuCallback(bot, callbackQuery) {
  const queryData = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const user = callbackQuery.from;
  const messageId = callbackQuery.message.message_id;

  // Answer the callback query immediately
  bot.answerCallbackQuery(callbackQuery.id);

  // --- Navigation ---
  if (queryData.startsWith('navigate:')) {
    const parts = queryData.split(':');
    const menuName = parts[1];
    const parentMenuName = parts.length > 2 ? parts[2] : null;

    // Special case for main menu (sends a new message)
    if (menuName === 'main') {
      handleStart(bot, { chat: { id: chatId }, from: user });
      return;
    }

    // Security check for admin menu
    if (menuName === 'admin' && user.id.toString() !== adminId) {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'شما دسترسی به این بخش را ندارید.', show_alert: true });
      return;
    }

    const targetMenu = menus[menuName];
    if (targetMenu) {
      const text = (typeof targetMenu.text === 'function') 
        ? targetMenu.text(user.first_name) 
        : targetMenu.text;
      
      // Deep clone the options to avoid modifying the original menu object
      const options = _.cloneDeep(
        (typeof targetMenu.options === 'function') 
          ? targetMenu.options(user.id) 
          : targetMenu.options
      );

      // Add a dynamic back button if a parent is specified
      if (parentMenuName) {
        if (!options.reply_markup) options.reply_markup = {};
        if (!options.reply_markup.inline_keyboard) options.reply_markup.inline_keyboard = [];
        
        options.reply_markup.inline_keyboard.push(
          [{ text: '➡️ بازگشت', callback_data: `navigate:${parentMenuName}` }]
        );
      }
      
      bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        ...options,
      });
    }
    return;
  }

  // --- User Actions ---
  if (queryData.startsWith('action:')) {
    const actionName = queryData.split(':')[1];
    if (actionName === 'start_quiz') {
      startQuiz(bot, chatId, user.id);
    }
    return;
  }

  // --- Admin Actions ---
  if (queryData.startsWith('admin:')) {
    if (user.id.toString() !== adminId) {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'شما دسترسی به این بخش را ندارید.', show_alert: true });
      return;
    }

    const parts = queryData.split(':');
    const actionName = parts[1];

    if (actionName === 'clear_history') {
      const confirmMenu = menus.confirmClearHistory;
      bot.editMessageText(confirmMenu.text, {
        chat_id: chatId,
        message_id: messageId,
        ...confirmMenu.options,
      });
    }
    return;
  }

  // --- Admin Confirmation Actions ---
  if (queryData.startsWith('admin_confirm:')) {
    if (user.id.toString() !== adminId) {
      bot.answerCallbackQuery(callbackQuery.id, { text: 'شما دسترسی به این بخش را ندارید.', show_alert: true });
      return;
    }

    const parts = queryData.split(':');
    const actionName = parts[1];
    const parentMenuName = parts.length > 2 ? parts[2] : null;

    if (actionName === 'clear_history') {
      try {
        await UserQuestionHistory.destroy({ where: {}, truncate: true });
        bot.answerCallbackQuery(callbackQuery.id, { text: 'تاریخچه پاک شد!', show_alert: true });
        
        bot.editMessageText('✅ تمام تاریخچه سوالات با موفقیت پاک شد.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [[{ text: '➡️ بازگشت به پنل ادمین', callback_data: `navigate:${parentMenuName}:main` }]]
          }
        });
      } catch (error) {
        console.error('Failed to clear question history:', error);
        bot.editMessageText('خطایی در پاکسازی دیتابیس رخ داد.', {
          chat_id: chatId,
          message_id: messageId,
        });
      }
    }
    return;
  }
}

module.exports = { handleMenuCallback };
