const moment = require('moment');
const edeka = require('./edeka');

edeka.getMenusForDay(moment(), console.log);
