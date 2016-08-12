var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  appName: defer (function (cfg) { return cfg.appName+'-test' } ),

  test: {
    commonStubs: {
      'cfg': {
        debug: function() {},
        error: function() {},
        info:  function() {}
      },
      'log': {
        debug:    function() {},
        error:    function() {},
        info:     function() {},
        setLevel: function() {}
      },
      'log4js': {
        configure: function() {},
        getLogger: function() {}
      }
    },
    personalGmail: {
      appSpecificPassword : process.env.PERSONAL_APP_SPECIFIC_PASSWORD,
      clientSecretFile    : defer( function (cfg) { return cfg.auth.clientSecretFile } ),
      emailsFrom          : "Nigel's Raspberry Pi Tester <"+process.env.PERSONAL_EMAIL+">",
      googleScopes        : ["https://mail.google.com"],
      name                : "rpi-tester",
      notificationTo      : process.env.PERSONAL_EMAIL,
      tokenDir            : defer( function (cfg) { return cfg.auth.tokenFileDir } ),
      tokenFile           : "access_token_rpi-tester.json",
      user                : process.env.PERSONAL_GMAIL_USERNAME
    },
    timeout: {
      unit: (1000*2),
      functional: (1000*60)
    }
  }

}
