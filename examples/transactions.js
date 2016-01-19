'use strict';

// This example fetches all transactions done during a given interval of days, attaching
// the correct category to every transaction. It then ends by printing the transaction + category
// data to stdout as a JSON array.

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

co(function* () {
  try {
    let menigaClient = new MenigaClient();
    let authed = yield menigaClient.auth(username, password);
    let categories = yield menigaClient.getUserCategories();
    let categoriesByIndex = _.indexBy(categories, 'Id');
    let page = 0;
    let transactions;
    let allTransactions = [];
    do {
      transactions = yield menigaClient.getTransactionsPage({
        filter: {
          PeriodFrom: moment('2016-01-01'),
          PeriodTo: moment('2016-01-31')
        },
        page: page
      });
      _.forEach(transactions.Transactions, function (transaction) {
        if (_.has(categoriesByIndex, transaction.CategoryId)) {
          transaction.Category = categoriesByIndex[transaction.CategoryId];
        }
        allTransactions.push(transaction);
      });
      page++;
    } while (transactions.HasMorePages);
    console.log(JSON.stringify(allTransactions));
  } catch (err) {
    console.error('got err:', err);
  }
});
