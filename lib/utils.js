'use strict';

let moment = require('moment');
let traverse = require('traverse');
let _ = require('lodash');

const ASPNET_DATE_REGEX = new RegExp('/Date\\(([0-9]+)([+-])?([0-9]+)?\\)/');

function fromAspNetDates(root, useMomentDates) {
  traverse(root).forEach(function (node) {
    if (_.isString(node)) {
      let matched = node.match(ASPNET_DATE_REGEX);
      if (matched) {
        // TODO: Respect the time-zone.
        let unixTime = Number(matched[1]) / 1000;
        let momentTime = moment.unix(unixTime);
        let date = useMomentDates ? momentTime : momentTime.toDate();
        this.update(date);
      }
    }
  });
  return root;
}

function toAspNetDates(root) {
  traverse(root).forEach(function (node) {
    if (_.isDate(node) || moment.isMoment(node)) {
      let unixTime = _.isDate(node) ? node.getTime() : node.unix() * 1000;
      this.update(`/Date(${unixTime}+0000)/`);
    }
  });
  return root;
}

// Exports
module.exports.toAspNetDates = toAspNetDates;
module.exports.fromAspNetDates = fromAspNetDates;
