'use strict';

// This example prints all categories belonging to the user to stdout in a JSON format.

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
    console.log(JSON.stringify(categories));
  } catch (err) {
    console.error('got err:', err);
  }
});
