'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var request = request.defaults({ jar: true });
var _ = require('lodash');

const RV_TOKEN_REGEX = new RegExp('value="([a-zA-Z0-9/+]+)"');
const BASE_URL = 'https://www.meniga.is';
const USER_AGENT = 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36';

function MenigaClient() {
  this.requestVerificationToken = null;
}

MenigaClient.prototype.auth = function (username, password) {
  var that = this; // Goddamn
  var options = {
    method: 'POST',
    url: BASE_URL + '/User/LogOn',
    headers: {
      'user-agent': USER_AGENT
    },
    form: {
      culture: 'is-IS',
      email: username,
      password: password
    },
    json: true
  };
  return request(options)
  .spread(function (res, body) {
    var options = {
      method: 'GET',
      url: BASE_URL + res.headers['location'],
      headers: {
        'user-agent': USER_AGENT
      },
      json: true
    }
    return request(options);
  })
  .spread(function (res, body) {
    // :O
    _.forEach(body.split('\n'), function (line) {
      if (line.indexOf('__RequestVerificationToken') >= 0) {
        let match = line.match(RV_TOKEN_REGEX);
        that.requestVerificationToken = match[1];
      }
    })
    return true;
  })
  .catch(function (err) {
    console.error(err);
    return false;
  });
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
  MenigaClient.prototype[endpoint.identifier] = function (options) {
    var options = {
      method: 'POST',
      url: BASE_URL + endpoint.path,
      body: options || {},
      headers: {
        'user-agent': USER_AGENT,
        '__RequestVerificationToken': this.requestVerificationToken
      },
      json: true,
    }
    return request(options)
    .spread(function (res, body) {
      if (res.statusCode >= 400) {
        throw new Error('Non-200 response from the Meniga API: ' + res.statusCode + ' body: ', body);
      }
      return body;
    });
  }
});

// Exports.
module.exports = MenigaClient;
