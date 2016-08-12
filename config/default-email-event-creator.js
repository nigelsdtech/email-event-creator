var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  appName: "email-event-creator",

  auth: {
    scopesGmail: ['https://www.googleapis.com/auth/gmail.modify'],
    scopesCalendar: ['https://www.googleapis.com/auth/calendar'],
    scopes: defer( function (cfg) { return cfg.auth.scopesGmail.concat(cfg.auth.scopesCalendar) } )
  },

  accounts: {
    personal: {
      auth: {
        tokenFile: defer( function (cfg) { return "access_token_"+cfg.appName+"-personal.json" } )
       },
      emailAddress: process.env.PERSONAL_EMAIL_ADDRESS
    },
    work: {
      auth: {
        tokenFile: defer( function (cfg) { return "access_token_"+cfg.appName+"-work.json" } )
      },
      emailAddress: process.env.OB_EMAIL_ADDRESS,
    }
  },

  gmailSearchCriteria: 'is:unread is:inbox subject:"CALENDAR INSERT"',

  processedLabelName: defer( function (cfg) { return cfg.appName+"-processed" } )
}
