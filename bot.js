'use strict';

const Botkit = require('botkit');
const controller = Botkit.slackbot();
const bot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN
});

bot.startRTM((error, bot, payload) => {
  if (error) {
    throw new Error('Could not connect to Slack');
  }
});

const edeka = require('./edeka');
const moment = require('moment');
const currentCityRegex = /setCurrentCity\((.*)\)/;

function getReplyForMealDay(error, menus, day) {
  if (error) {
    return `Es ist ein Fehler aufgetreten:\n${error}`;
  }
  let reply = `${day.locale('de').format('dddd, Do MMMM')}:\n`;
  menus.forEach(menu => {
    reply += menu.meal;
    if (menu.price) {
      reply += `, ${menu.price}`;
    }
    reply += '\n';
  });
  return reply;
}

controller.hears('Edeka', 'direct_message,direct_mention,mention,ambient', (bot, message) => {
  const currentCity = message.text.match(currentCityRegex);
  if (currentCity && currentCity.length > 0) {
    edeka.setCurrentCity(currentCity[1]);
    bot.reply(message, `Stadt geändert in ${currentCity[1]}`);
    return;
  }

  const text = message.text.toLowerCase();

  // Week menus
  let weekNumber;
  if (text.match(/nächsten? woche/g)) {
    weekNumber = 1;
  } else if (text.indexOf('woche') !== -1) {
    weekNumber = 0;
  }
  if (weekNumber !== undefined) {
    edeka.getMenusForWeek(weekNumber, (error, days) => {
      if (error) {
        bot.reply(message, `Es ist ein Fehler aufgetreten:\n${error}`);
        return;
      }
      let reply = '';
      days.forEach(day => {
        reply += getReplyForMealDay(error, day.meals, day.date) + '\n';
      });
      bot.reply(message, reply);
    });
    return;
  }

  // Get menu for a day
  let day;
  if (text.indexOf('morgen') !== -1) {
    // Tomorrow
    day = moment().add(1, 'day');
  } else {
    // Default: Get menu for today
    day = moment();
  }
  edeka.getMenusForDay(day, (error, menus) => {
    const reply = getReplyForMealDay(error, menus, day)
    bot.reply(message, reply);
  });
});

// Create dummy server to let openshift know that this app is running well
const http = require('http');
const server = http.createServer((request, response) => {
  response.writeHead(200);
  response.end();
});

server.listen(
  process.env.OPENSHIFT_NODEJS_PORT ||
  process.env.OPENSHIFT_INTERNAL_PORT || 8080,
  process.env.OPENSHIFT_NODEJS_IP ||
  process.env.OPENSHIFT_INTERNAL_IP);
