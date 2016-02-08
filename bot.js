// const Botkit = require('botkit');
const edeka = require('./edeka');
// const controller = Botkit.slackbot();
// const bot = controller.spawn({
  // token: process.env.SLACK_BOT_TOKEN
// });

// bot.startRTM((error, bot, payload) => {
//   if (error) {
//     throw new Error('Could not connect to Slack');
//   }
// });
//
// controller.hears('Edeka', 'direct_message,direct_mention,mention,ambient', (bot,message) => {
//   bot.reply(message, 'Hi');
// });

edeka.getMenuForDay((error, result) => {
  console.log(error);
});
