'use strict';

const htmlparser = require('htmlparser');
const moment = require('moment');
const request = require('request');
const select = require('soupselect').select;

const menu_url = 'http://simmel.de/wochenmenue/';
let currentCity = 'muenchen';

const dateRegex = /\d\d[.]\d\d[.]\d\d/g;
const dateFormat = 'DD.MM.YYYY';

function setCurrentCity(city) {
  currentCity = city;
}

function parseMeals(rawMeals) {
  const meals = [];
  rawMeals.forEach(rawMeal => {
    const meal = {};
    try {
      meal.meal = select(rawMeal, 'div.value')[0].children[0].data;
      meal.price = select(rawMeal, 'div.price')[0].children[0].data;
    } catch (e) {}
    meals.push(meal);
  });
  return meals;
}

function parseDays(rawDays) {
  const days = [];
  rawDays.forEach(rawDay => {
    const day = {};
    try {
      const dayString = select(rawDay, 'h5')[0].children[0].data;
      const dayDate = dayString.match(dateRegex)[0];
      day.date = moment(dayDate, dateFormat);
      const rawMeals = select(rawDay, 'div.item');
      day.meals = parseMeals(rawMeals);
    } catch (e) {}
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
  request(`${menu_url}${currentCity}`, (error, response, body) => {
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

function getMenusFromDayAndWeek(day, week) {
  return week.days.filter(weekDay => weekDay.date.weekday() === day.weekday())[0].meals;
}

function getMenusForDay(day, callback) {
  getWeeks((error, weeks) => {
    if (error) {
      callback(error);
      return;
    }
    try {
      const week = weeks.filter(week => isWithinWeek(day, week))[0];
      const menus = getMenusFromDayAndWeek(day, week);
      if (menus) {
        callback(null, menus);
        return;
      }
      callback(`Could not find menu for day: ${day}`);
    } catch (e) {
      callback(e);
    }
  });
}

function getMenusForWeek(weekNumber, callback) {
  getWeeks((error, weeks) => {
    if (error) {
      callback(error);
      return;
    }
    const week = weeks[weekNumber];
    if (!week) {
      callback('Das Menü für diese Woche ist leider noch nicht verfügbar!');
      return;
    }
    callback(null, week.days);
  });
}

module.exports = {
  getMenusForDay: getMenusForDay,
  getMenusForWeek: getMenusForWeek,
  setCurrentCity: setCurrentCity
};
