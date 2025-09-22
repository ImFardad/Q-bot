const { adminId } = require('../config');

const menus = {
  main: {
    text: (name) => `سلام ${name}!\n\nبه ربات ما خوش آمدید. لطفاً یکی از گزینه‌های زیر را انتخاب کنید:`, 
    options: (userId) => {
      const keyboard = [
        [{ text: 'گزینه اول', callback_data: 'navigate:option1:main' }],
        [{ text: 'گزینه دوم', callback_data: 'navigate:option2:main' }],
        [{ text: 'گزینه سوم', callback_data: 'navigate:option3:main' }],
        [{ text: '🎲 حل سوال', callback_data: 'action:start_quiz' }],
      ];

      // Add admin panel button if the user is an admin
      if (userId && userId.toString() === adminId) {
        keyboard.push([{ text: '👑 پنل ادمین', callback_data: 'navigate:admin:main' }]);
      }

      return {
        reply_markup: {
          inline_keyboard: keyboard,
        },
      };
    },
  },
  option1: {
    text: 'شما در منوی "گزینه اول" هستید. این یک متن آزمایشی است.',
    options: {
      reply_markup: {
        inline_keyboard: [], // Back button will be added dynamically
      },
    },
  },
  option2: {
    text: 'اینجا صفحه مربوط به "گزینه دوم" است.',
    options: {
      reply_markup: {
        inline_keyboard: [], // Back button will be added dynamically
      },
    },
  },
  option3: {
    text: 'شما "گزینه سوم" را انتخاب کرده‌اید. محتوای این صفحه می‌تواند متفاوت باشد.',
    options: {
      reply_markup: {
        inline_keyboard: [], // Back button will be added dynamically
      },
    },
  },
  admin: {
    text: '👑 پنل مدیریت ربات',
    options: {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🗑 پاکسازی تاریخچه سوالات', callback_data: 'admin:clear_history:admin' }],
        ],
      },
    },
  },
  confirmClearHistory: {
    text: '⚠️ **اخطار!**\n\nآیا از پاک کردن **تمام** تاریخچه سوالات پرسیده شده توسط **تمام کاربران** مطمئن هستید؟\nاین عمل غیرقابل بازگشت است.',
    options: {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '❌ نه، لغو کن', callback_data: 'navigate:admin:main' }, // Go back to admin panel
            { text: '✅ بله، پاک کن', callback_data: 'admin_confirm:clear_history:admin' }, // Pass parent
          ],
        ],
      },
    },
  },
};

module.exports = { menus };