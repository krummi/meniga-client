# Meniga API
> An unofficial Node API client for Meniga.

## What is this?

[Meniga](https://www.meniga.com) is an Icelandic company that uses machine-learning techniques to automatically categorize your credit/debit card transactions (i.e. transportation, grocery, restaurants, coffee, etc). On top of this they provide you with a web interface to this data that aims to give you insight into how you spend your money.

Unfortunately, this web interface has remained the same for ages and even though it still remains hugely useful to me I have now started exploring other ways to access this data, i.e. by communicating directly with their APIs, which are _not publicly available_.

This repository aims to create an unofficial Node Meniga API client so hackers can expand on the Meniga's limited web UI.

## A word of caution

Note that this project aims to provide an API client to a non-public API that _can_ change at any point without notice. This project is thus only useful for hobby projects.

## How to use?

```javascript
var meniga = new MenigaClient();
meniga.auth('<username>', '<password>')
.then(function () {
  return meniga.getTransactionsPage({
    PeriodFrom: moment('2016-01-01'),
    PeriodTo: moment('2016-02-01')
  });
})
```

## Note

This stuff is _only_ useful to you if you have access to Meniga  which you probably don't if you're outside of Iceland.
