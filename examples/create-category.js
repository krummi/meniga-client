'use strict';

// This creates a category, allowing for the configuration of categoryType and whether
// the category is fixed or not.

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
    let success = yield menigaClient.createUserCategory({
      categoryType: '0',
      isFixedExpenses: true,
      name: 'Húsfélagsgjöld',
      parentId: '13'
    });
    console.log(success);
  } catch (err) {
    console.log(err);
    console.log(err.stack)
  }
});