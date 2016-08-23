var cfg   = require('config');
var defer = require('config/defer').deferConfig;

module.exports = {

  appName: defer (function (cfg) { return cfg.appNameBase+'-test' } ),

  log: {
    level: "INFO",
    log4jsConfigs: {
      appenders: [
        {
          type:       "file",
          filename:   defer(function (cfg) { return cfg.log.logDir.concat("/" , cfg.appName , ".log" ) }),
          category:   defer(function (cfg) { return cfg.appName }),
          reloadSecs: 60,
          maxLogSize: 612000
        }
      ],
      replaceConsole: false
    }
  },
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
    notificationTo : defer( function (cfg) { return process.env.PERSONAL_EMAIL.replace("@","+"+cfg.appName+"@") } ),
    testerGmail: {
      appSpecificPassword : process.env.PERSONAL_APP_SPECIFIC_PASSWORD,
      clientSecretFile    : defer( function (cfg) { return cfg.auth.clientSecretFile } ),
      emailAddress        : process.env.PERSONAL_EMAIL,
      emailsFrom          : "Nigel's Raspberry Pi Tester <"+process.env.PERSONAL_EMAIL+">",
      googleScopes        : ["https://mail.google.com"],
      name                : "rpi-tester",
      tokenDir            : defer( function (cfg) { return cfg.auth.tokenFileDir } ),
      tokenFile           : "access_token_rpi-tester.json",
      user                : process.env.PERSONAL_GMAIL_USERNAME
    },
    timeout: {
      unit: (1000*5),
      functional: (1000*60)
    }
  }

}
