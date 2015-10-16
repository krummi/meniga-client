'use strict';

let bluebird = require('bluebird');
let co = require('co');
let _ = require('lodash');
let moment = require('moment');

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
        PeriodFrom: moment('2015-10-01'),
        PeriodTo: moment('2015-11-01')
      }
    });
    console.log('trans:', transactions.Transactions[0]);
  } catch (err) {
    console.error('got err:', err);
  }
});
