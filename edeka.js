const htmlparser = require('htmlparser');
const moment = require('moment');
const request = require('request');
const select = require('soupselect').select;

const menu_url = 'http://simmel.de/wochenmenue/dresden';
// const menu_url = 'http://simmel.de/wochenmenue/muenchen';

const dateRegex = /\d\d[.]\d\d[.]\d\d/g;
const dateFormat = 'DD.MM.YYYY';

function parseMeals(rawMeals) {
  const meals = [];
  rawMeals.forEach(rawMeal => {
    const meal = {};
    meal.meal = select(rawMeal, 'div.value')[0].children[0].data;
    meal.price = select(rawMeal, 'div.price')[0].children[0].data;
    meals.push(meal);
  });
  return meals;
}

function parseDays(rawDays) {
  const days = [];
  rawDays.forEach(rawDay => {
    const day = {};
    const dayString = select(rawDay, 'h5')[0].children[0].data;
    const dayDate = dayString.match(dateRegex)[0];
    day.date = moment(dayDate, dateFormat);
    const rawMeals = select(rawDay, 'div.item');
    day.meals = parseMeals(rawMeals);
    days.push(day);
  });
  return days;
}

function parseWeek(rawWeek) {
  const week = {};
  const weekString = select(rawWeek, 'h4')[0].children[0].data;
  const weekDates = weekString.match(dateRegex);
  week.startDay = moment(weekDates[0], dateFormat);
  week.endDay = moment(weekDates[1], dateFormat);

  const rawDays = select(rawWeek, 'div.market-menu');
  week.days = parseDays(rawDays);

  return week;
}

function getWeeks(callback) {
  request(menu_url, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      callback(error || response.statusCode);
      return;
    }
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        callback(error);
        return;
      }
      const rawWeeks = select(dom, 'div.element');
      callback(null, rawWeeks.map(parseWeek));
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(body);
  });
}

function isWithinWeek(day, week) {
  return day.isBetween(week.startDay, week.endDay);
}

function getMenuForDay(callback) {
  getWeeks((error, weeks) => {
    if (error) {
      callback(error);
      return;
    }
    const today = moment();
    weeks.forEach(week => {
      if (isWithinWeek(today, week)) {
        return getMenuFromDayAndWeek(today, week);
      }
    })
  });
}

module.exports = {
  getMenuForDay: getMenuForDay
};
