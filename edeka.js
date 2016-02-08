const htmlparser = require('htmlparser');
const request = require('request');
const select = require('soupselect').select;

const menu_url = 'http://simmel.de/wochenmenue/muenchen';

function getMenuForDay(callback) {
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
      const weeks = select(dom, 'div.element');
      weeks.forEach(console.log);
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(body);
  })
}

module.exports = {
  getMenuForDay: getMenuForDay
};
