'use strict';

let Promise = require('bluebird');
let request = Promise.promisify(require('request'));
request = request.defaults({ jar: true });
let _ = require('lodash');

const RV_TOKEN_REGEX = new RegExp('value="([a-zA-Z0-9/+]+)"');
const USER_AGENT = 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36';

function MenigaClient() {
  this.baseUrl = 'https://www.meniga.is';
  this.requestVerificationToken = null;
}

MenigaClient.prototype.auth = function* (username, password) {
  var that = this; // Goddamn it

  var options = {
    method: 'POST',
    url: `${this.baseUrl}/User/LogOn`,
    headers: { 'user-agent': USER_AGENT },
    form: { culture: 'is-IS', email: username, password: password },
    json: true
  };
  const logonResponse = yield request(options).get(0);

  // Make the follow-up request to fetch the request verification token.
  // I actually have no idea if this is needed or not.
  options = {
    method: 'GET',
    url: this.baseUrl + logonResponse.headers['location'],
    headers: { 'user-agent': USER_AGENT },
    json: true
  };

  // Where art thou destructuring?!
  const resAndBody = yield request(options);
  const res = resAndBody[0];
  const body = resAndBody[1];

  // Parse the "__RequestVerificationToken" from the HTML body. Sawry.
  _.forEach(body.split('\n'), function (line) {
    if (line.indexOf('__RequestVerificationToken') >= 0) {
      let match = line.match(RV_TOKEN_REGEX);
      that.requestVerificationToken = match[1];
    }
  });

  return true;
}

var endpoints = [
  {
    identifier: 'getBudgetEquationWidget',
    path: '/Api/Widgets/GetBudgetEquationWidget',
    params: [
      { name: 'period', type: 'integer', description: 'no idea...' }
    ]
  }, {
    identifier: 'getTransactionsPage',
    path: '/Api/Transactions/GetTransactionsPage',
    params: [
      { name: 'PeriodFrom', type: 'datetime', description: 'lower bound timestamp' },
      { name: 'PeriodTo', type: 'datetime', description: 'upper bound timestamp' },
    ]
  }
];

_.forEach(endpoints, function (endpoint) {
  MenigaClient.prototype[endpoint.identifier] = function* (options) {
    var options = {
      method: 'POST',
      url: this.baseUrl + endpoint.path,
      body: options || {},
      headers: {
        'user-agent': USER_AGENT,
        '__RequestVerificationToken': this.requestVerificationToken
      },
      json: true,
    }
    let resAndBody = yield request(options);
    let res = resAndBody[0];
    let body = resAndBody[1];
    if (res.statusCode >= 400) {
      throw new Error('Non-200 response from the Meniga API: ' + res.statusCode + ' body: ', body);
    }
    return body;
  }
});

// Exports.
module.exports = MenigaClient;
