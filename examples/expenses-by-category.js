'use strict';

// This example fetches statistics on your spend by category, ordered by the amount and returns
// it as a JSON string.

let bluebird = require('bluebird');
let co = require('co');
let _ = require('lodash');
let moment = require('moment');

let MenigaClient = require('../index');

if (process.argv.length !== 4) {
  console.error('usage: node expenses-by-category.js <meniga username> <meniga password>')
  process.exit(-1);
}

let username = process.argv[2];
let password = process.argv[3];

function createOptions(categories) {
  return {
    filter: {
      Type: 1,
      Group: 1,
      View: 1,
      Options: {
        IsParent: true,
        AccumulateCategoryExpenses: false,
        SkipInvertedCategories: true,
        GetFuture: false,
        FutureMonths: 6,
        GetAverage: false,
        ExcludeNonMappedMerchants: false,
        MaxTopMerchants: 10,
        IncludeSavingsInNetIncome: true,
        DateFormat: null,
        MinPieSliceValue: 1,
        MinSlicesInPie: 0,
        MaxSlicesInPie: 1000,
        UseAndSearchForTags: false,
        DisableSliceGrouping: false
      },
      Period: '0', // this month!
      PeriodFrom: null,
      PeriodTo: null,
      ComparisonPeriod: null,
      CategoryIds: categories,
      AccountIds: null,
      AccountIdentifiers: null,
      Merchants: null,
      Tags: null
    }
  };
}

function rpad(s, n) {
  return s + ' '.repeat(Math.max(n - s.length, 0));
}

co(function* () {
  try {
    let menigaClient = new MenigaClient();
    let authed = yield menigaClient.auth(username, password);
    let categories = yield menigaClient.getUserCategories();
    let allCategoryIds = _.pluck(categories, 'Id');
    let report = yield menigaClient.getTrendsReport(createOptions(allCategoryIds));
    let results = _.map(report.Series.Rows, function (row) {
      let data = _.pluck(row.Columns, 'Value');
      // console.log(`${rpad(data[0], 40)}${-data[1]} kr.`);
      return { name: data[0], amount: -data[1] };
    });
    console.log(JSON.stringify(results));
  } catch (err) {
    console.error('got err:', err);
  }
});
