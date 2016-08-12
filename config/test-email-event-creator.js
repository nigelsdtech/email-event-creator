var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  appName: process.env.npm_package_config_appName,

  auth: {
    scopesGmail: ['https://mail.google.com']
  },

  accounts: {
    personalTest: {
      auth: {
        tokenFile: defer( function (cfg) { return "access_token_"+cfg.appName+"-testPersonal.json" } )
      },
      emailAddress: process.env.PERSONAL_EMAIL_ADDRESS
    }
  },

  timeout: {
    functional: 20000,
    unit: 2000
  }

}
