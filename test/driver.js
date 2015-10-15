'use strict';

let bluebird = require('bluebird');
let co = require('co');
let _ = require('lodash');

let MenigaClient = require('../lib/meniga');

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
    console.log('successfully authed?', authed);
    let transactions = yield menigaClient.getTransactionsPage({
      filter: {
        PeriodFrom: '/Date(1443657600000)/',
        PeriodTo: '/Date(1444089600000)/'
      }
    });
    console.log(_.pluck(transactions.Transactions, ['Amount']));
    //console.log(_.pluck(transactions.Transactions, ['Amount', 'OriginalDate']));
  } catch (err) {
    console.error('got err:', err);
  }
});
