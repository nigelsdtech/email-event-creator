var 
    account        = require('./Account.js'),
    cfg            = require('config'),
    log4js         = require('log4js'),
    reporter       = require('reporter');



/*
* Receive an email containing CSV data to be added to the google calendar
*
*/


module.exports = function () {


  /*
   * Initialize
   */


  // logs

  log4js.configure(cfg.log.log4jsConfigs);

  var log = log4js.getLogger(cfg.log.appName);
  log.setLevel(cfg.log.level);


  /*
   * Job reporter
   */
  reporter.configure(cfg.reporter);


  /*
   * Tidy error handler
   */
  function handleError(errMsg) {
    log.error(errMsg)
    reporter.handleError(errMsg)
  }


  /*
   * Main program
   */


  log.info('Begin script');
  log.info('============');



  try {


    for (var a in cfg.accounts) {

      log.info('Processing account %s', a);

      // Setup the account
      var account = new Account({
        clientSecretFile: cfg.auth.clientSecretFile,
        googleScopes:     cfg.auth.scopes,
        name:             mb,
        searches:         mbs[mb].searches,
        tokenDir:         cfg.auth.tokenFileDir,
	tokenFile:        mbs[mb].auth.tokenFile
      })

      account.process(null,handleError)
    };


  } catch (err) {

    var errMsg = 'Error in main body:\n ' + err + '\n' + err.stack;
    handleError(errMsg)
    return null;
  }

  return;


}
