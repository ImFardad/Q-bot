const { menus } = require('../keyboards/inlineKeyboards');
const User = require('../db/User');

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const user = msg.from;

  try {
    // Find the user in the database first
    const existingUser = await User.findByPk(user.id);

    const userData = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name || null,
      username: user.username || null,
    };

    // Check if user exists and if their data has changed
    if (existingUser) {
      if (
        existingUser.firstName !== userData.firstName ||
        existingUser.lastName !== userData.lastName ||
        existingUser.username !== userData.username
      ) {
        // Data has changed, so update it
        await User.upsert(userData);
        console.log(`User ${user.id} (${user.first_name}) was updated in the database.`);
      } else {
        // Data is the same, do nothing
        console.log(`User ${user.id} (${user.first_name}) data is unchanged. Skipping database write.`);
      }
    } else {
      // User does not exist, create them
      await User.upsert(userData);
      console.log(`New user ${user.id} (${user.first_name}) was created in the database.`);
    }
  } catch (error) {
    console.error('Failed to save or check user in database:', error);
  }

  const mainMenu = menus.main;
  const welcomeText = mainMenu.text(user.first_name);

  bot.sendMessage(chatId, welcomeText, mainMenu.options);
}

module.exports = { handleStart };