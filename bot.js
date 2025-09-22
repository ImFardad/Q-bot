const TelegramBot = require('node-telegram-bot-api');
const { token } = require('./config');
const { handleStart } = require('./handlers/startHandler');
const { handleMenuCallback } = require('./handlers/menuHandler');
const { handleQuizAnswer } = require('./handlers/quizHandler');
const sequelize = require('./db/database');
require('./db/User'); // Import model to ensure it's registered
require('./db/UserQuestionHistory'); // Import model to ensure it's registered

async function startBot() {
  if (!token) {
    console.error('Error: TELEGRAM_TOKEN is not defined in the .env file.');
    process.exit(1);
  }

  // Initialize and synchronize the database
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to synchronize the database:', error);
    process.exit(1);
  }

  const bot = new TelegramBot(token, { polling: true });

  // Handler for the /start command
  bot.onText(/\/start/, (msg) => handleStart(bot, msg));

  // Listener for general messages to handle quiz answers
  bot.on('message', (msg) => {
    if (msg.text && msg.text.startsWith('/')) {
      return;
    }
    handleQuizAnswer(bot, msg);
  });

  // General handler for all callback queries
  bot.on('callback_query', (callbackQuery) => {
    handleMenuCallback(bot, callbackQuery);
  });

  // Polling error listener
  bot.on('polling_error', (error) => {
    console.error(`Polling Error: [${error.code}] ${error.message}`);
  });

  console.log('Bot has started successfully and is polling for updates.');
}

module.exports = { startBot };
