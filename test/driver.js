var MenigaClient = require('../lib/meniga');

if (process.argv.length !== 4) {
  console.error('usage: node driver.js <meniga username> <meniga password>')
  process.exit(-1);
}

var username = process.argv[2];
var password = process.argv[3];

var menigaClient = new MenigaClient();
menigaClient.auth(username, password)
.then(function () {
  return menigaClient.getTransactionsPage({
    filter: {
      PeriodFrom: '/Date(1443657600000)/',
      PeriodTo: '/Date(1444089600000)/'
    }
  });
})
.then(function (transactions) {
  console.log(transactions);
  console.log('# of transactions:', transactions.length);
});
