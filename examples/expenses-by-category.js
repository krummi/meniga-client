'use strict';

// This example fetches statistics on your spend by category, ordered by the amount and returns
// it as a JSON string.

let bluebird = require('bluebird');
let co = require('co');
let _ = require('lodash');
let moment = require('moment');

let MenigaClient = require('../index');

let username = process.env.MENIGA_USERNAME;
let password = process.env.MENIGA_PASSWORD;
if (!username || !password) {
  console.error('You need to configure both env vars: MENIGA_USERNAME and MENIGA_PASSWORD');
}

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
      Period: '0', // '1', // '0' = this month, '1' = last month :O
      PeriodFrom: null, // moment('2015-01-01 00:00:00'),
      PeriodTo: null, // moment('2016-01-01 00:00:00'),
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

function isFixed(name, categoriesByName) {
  if (_.has(categoriesByName, name)) {
    return (name === 'Áskriftir og miðlun' || categoriesByName[name].IsFixedExpenses);
  } else {
    return false;
  }
}

function print(obj) {
  _.forEach(obj.transactions, data => {
    console.log(`  ${rpad(data[0], 40)}${-data[1]} kr.`);
  });
  console.log(`  ${rpad('Total:', 40)}${-obj.total} kr.`);
}

co(function* () {
  try {
    let menigaClient = new MenigaClient();
    let authed = yield menigaClient.auth(username, password);
    let categories = yield menigaClient.getUserCategories();
    let allCategoryIds = _.pluck(categories, 'Id');
    let categoriesByName = _.indexBy(categories, 'Name'); // we don't get the category id?
    let report = yield menigaClient.getTrendsReport(createOptions(allCategoryIds));

    let fixed    = { total: 0, transactions: [] };
    let variable = { total: 0, transactions: [] };
    _.forEach(report.Series.Rows, row => {
      let data = _.pluck(row.Columns, 'Value');
      if (isFixed(data[0], categoriesByName)) {
        fixed.transactions.push(data);
        fixed.total += data[1];
      } else {
        variable.transactions.push(data);
        variable.total += data[1];
      }
    });

    // print stuff:
    console.log('Fixed:');
    print(fixed);

    console.log('\nVariable:');
    print(variable);

  } catch (err) {
    console.error('got err:', err);
    console.error(err.stack);
  }
});
