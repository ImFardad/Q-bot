const menus = {
  main: {
    text: (name) => `سلام ${name}!

به ربات ما خوش آمدید. لطفاً یکی از گزینه‌های زیر را انتخاب کنید:`,
    options: {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'گزینه اول', callback_data: 'navigate:option1' }],
          [{ text: 'گزینه دوم', callback_data: 'navigate:option2' }],
          [{ text: 'گزینه سوم', callback_data: 'navigate:option3' }],
          [{ text: '🎲 حل سوال', callback_data: 'action:start_quiz' }],
        ],
      },
    },
  },
  option1: {
    text: 'شما در منوی \"گزینه اول\" هستید. این یک متن آزمایشی است.',
    options: {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ بازگشت به منوی اصلی', callback_data: 'navigate:main' }],
        ],
      },
    },
  },
  option2: {
    text: 'اینجا صفحه مربوط به \"گزینه دوم\" است.',
    options: {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ بازگشت به منوی اصلی', callback_data: 'navigate:main' }],
        ],
      },
    },
  },
  option3: {
    text: 'شما \"گزینه سوم\" را انتخاب کرده‌اید. محتوای این صفحه می‌تواند متفاوت باشد.',
    options: {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ بازگشت به منوی اصلی', callback_data: 'navigate:main' }],
        ],
      },
    },
  },
};

module.exports = { menus };