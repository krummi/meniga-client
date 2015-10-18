'use strict';

// This example fetches all transactions done during a given interval of days, attaching
// the correct category to every transaction. It then ends by printing the transaction + category
// data to stdout as a JSON array.

let bluebird = require('bluebird');
let co = require('co');
let _ = require('lodash');
let moment = require('moment');

let MenigaClient = require('../index');

if (process.argv.length !== 4) {
  console.error('usage: node driver.js <meniga username> <meniga password>')
  process.exit(-1);
}

let username = process.argv[2];
let password = process.argv[3];

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
          PeriodFrom: moment('2015-10-01'),
          PeriodTo: moment('2015-11-01')
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
