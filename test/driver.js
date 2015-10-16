'use strict';

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
    let page = 0;
    let transactions;
    do {
      transactions = yield menigaClient.getTransactionsPage({
        filter: {
          PeriodFrom: moment('2015-10-01'),
          PeriodTo: moment('2015-11-01')
        },
        page: page
      });
      console.log(`found ${transactions.Transactions.length} transactions`);
      let a = -_.sum(_.filter(_.pluck(transactions.Transactions, 'Amount'), amount => amount < 0));
      console.log(`you've spent ${a} kr. in those transactions`);
      page++;
    } while (transactions.HasMorePages);
  } catch (err) {
    console.error('got err:', err);
  }
});
