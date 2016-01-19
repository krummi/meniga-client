'use strict';

let bluebird = require('bluebird');
let request = bluebird.promisify(require('request'));
request = request.defaults({ jar: true });
let _ = require('lodash');

let utils = require('./lib/utils.js');

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
    identifier: 'createUserCategory',
    path: '/Api/User/CreateUserCategory',
    params: [
      { name: 'categoryType', type: 'string', description: 'expenses ("0")' },
      { name: 'isFixedExpenses', type: 'boolean', description: 'whether this is fixed or variable expenses' },
      { name: 'name', type: 'string', description: 'the name of the new category' },
      { name: 'parentId', type: 'string', description: 'the parent category of the new category' }
    ]
  },
  {
    identifier: 'getBudgetEquationWidget',
    path: '/Api/Widgets/GetBudgetEquationWidget',
    params: [
      { name: 'period', type: 'integer', description: 'no idea...' }
    ]
  }, {
    identifier: 'getTransactionsPage',
    path: '/Api/Transactions/GetTransactionsPage',
    description: 'Fetches data on transactions and their categories over timespans',
    params: [
      { name: 'page', type: 'integer', description: 'the page number to fetch' },
      { name: 'transactionsPerPage', type: 'integer', description: 'the number of transactions per page' },
      { name: 'filter', type: 'object', description: 'the filters to apply', subProperties: [
        { name: 'PeriodFrom', type: 'datetime', description: 'lower bound timestamp' },
        { name: 'PeriodTo', type: 'datetime', description: 'upper bound timestamp' },
      ] }
    ]
  }, {
    identifier: 'getUserCategories',
    path: '/Api/User/GetUserCategories',
    description: 'Fetches data on all public categories and the ones created by the currently logged in user.',
    params: []
  }, {
    identifier: 'getTrendsReport',
    path: '/Api/Planning/GetTrendsReport',
    description: 'An analytics endpoint allowing you to analyze your expenses by categories and over timespans',
    params: [
      { name: 'filter', type: 'object', description: 'the filters to apply', subProperties: [
        { name: 'View', type: 'integer', defaults: 1, description: '1 = sum over all months, 2 = group by month' },
        { name: 'Type', type: 'integer', defaults: 1, description: '1 = im not sure, just use that' },
        { name: 'Tags', type: 'array[string]', defaults: null, description: 'the tags to analyze, null to ignore.'},
        { name: 'Period', type: 'string', defaults: '0', description: '0=this month, 1=last month, 3=last 3 months, 6=last 6 months, 12=last 12 months, -1=this year, -2=last year'},
        { name: 'PeriodFrom', type: 'datetime', defaults: null, description: 'lower bound timestamp, overrides "Period".' },
        { name: 'PeriodTo', type: 'datetime', defaults: null, description: 'upper bound timestamp, overrides "Period".' },
        { name: 'Merchants', type: 'string', defaults: null, description: 'im not sure, null is default.' },
        { name: 'Group', type: 'integer', defaults: 1, description: 'im not sure' },
        { name: 'CategoryIds', type: 'array[integer]', description: 'IDs of the categories to analyze' },
        { name: 'AccountIdentifiers', type: '?', defaults: null, description: '?' },
        { name: 'AccountIds', type: '?', defaults: null, description: '?' },
        { name: 'ComparisonPeriod', type: '?', defaults: null, description: '?' },
        { name: 'Options', type: 'object', description: 'additional options to apply', subProperties: [
          { name: 'AccumulateCategoryExpenses', type: 'boolean', defaults: false, description: '?' },
          { name: 'DateFormat', type: '?', defaults: null, description: '?' },
          { name: 'DisableSliceGrouping', type: '?', defaults: false, description: '?' },
          { name: 'ExcludeNonMappedMerchants', type: '?', defaults: false, description: '?' },
          { name: 'FutureMonths', type: 'integer', description: '?' },
          { name: 'GetAverage', type: 'boolean', defaults: false, description: '?' },
          { name: 'GetFuture', type: 'boolean', description: '?' },
          { name: 'IncludeSavingsInNetIncome', type: 'boolean', defaults: true, description: '?' },
          { name: 'IsParent', type: 'boolean', defaults: true, description: '?' },
          { name: 'MaxSlicesInPie', type: 'integer', defaults: 10, description: '?' },
          { name: 'MaxTopMerchants', type: 'integer', defaults: 10, description: '?' },
          { name: 'MinPieSliceValue', type: 'integer', defaults: 1, description: '?' },
          { name: 'MinSlicesInPie', type: 'integer', defaults: 5, description: '?' },
          { name: 'SkipInvertedCategories', type: 'boolean', defaults: false, description: '?' },
          { name: 'UseAndSearchForTags', type: 'boolean', defaults: false, description: '?' }
        ] }
      ] }
    ]
  }
];

_.forEach(endpoints, function (endpoint) {
  MenigaClient.prototype[endpoint.identifier] = function* (options) {
    var options = {
      method: 'POST',
      url: this.baseUrl + endpoint.path,
      body: utils.toAspNetDates(options || {}),
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

    return utils.fromAspNetDates(body, false);
  }
});

// Exports.
module.exports = MenigaClient;
