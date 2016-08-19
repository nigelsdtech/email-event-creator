var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  account: 'OverrideMePerInstance',

  auth: {
    scopesGmail: ['https://www.googleapis.com/auth/gmail.modify'],
    scopesCalendar: ['https://www.googleapis.com/auth/calendar'],
    scopes: defer( function (cfg) { return cfg.auth.scopesGmail.concat(cfg.auth.scopesCalendar) } ),
    tokenFile: defer( function (cfg) { return "access_token_"+cfg.appName+"-"+cfg.account+".json" } )
  },

  emailAddress: 'OverrideMePerInstance Me',

  gmailSearchCriteria: 'is:unread is:inbox subject:"CALENDAR INSERT"',

  processedLabelName: defer( function (cfg) { return cfg.appName+"-processed" } )
}
