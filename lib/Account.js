"use strict"

var
    cfg               = require('config'),
    CalendarModel     = require('calendar-model'),
    Converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    GmailModel        = require('gmail-model'),
    log4js            = require('log4js')


/*
 * Object variables
 */

var
    _calendar,
    _converter,
    _en,
    name,
    log


/**
 * Account model constructor.
 * @param {object}   params - Params to be passed in
 * @param {string}   params.account - The name of this account (to be searched for in the configs)
 * @constructor
 */
function Account (params) {

  // logs
  log4js.configure(cfg.log.log4jsConfigs);

  log = log4js.getLogger(cfg.log.appName);
  log.setLevel(cfg.log.level);


  // Setup the notification checker
  this._en = new EmailNotification({
    gmail: {
      clientSecretFile:     cfg.auth.clientSecretFile,
      googleScopes:         cfg.auth.scopesGmail,
      name:                 params.account,
      tokenDir:             cfg.auth.tokenFileDir,
      tokenFile:            cfg.accounts[params.account].tokenFile
    },
    gmailSearchCriteria:    cfg.gmailSearchCriteria,
    processedLabelName:     cfg.processesLabelName
  })

  // Setup the google calendar
  this._calendar = new CalendarModel({
    name:             params.account,
    calendarId:       'primary',
    clientSecretFile: cfg.auth.clientSecretFile,
    googleScopes:     cfg.auth.scopesCalendar,
    tokenDir:         cfg.auth.tokenFileDir,
    tokenFile:        cfg.accounts[params.account].tokenFile,
    log4js:           log4js,
    logLevel:         cfg.log.level
  })

  this.name = params.account

  this._converter = new Converter({toArrayString: true});
  this._converter.transform = this.converterDefinition


  log.info('[%s] Search criteria: %s', this.name, cfg.gmailSearchCriteria)

}


var method = Account.prototype

/*
 *
 * account.converterDefinition
 *
 * @desc Definition of the conversion from CSV to JSON to be used by the csvtojson package
 *
 * The input comes in this format:
 *
 * Start|StartTimeZone|End|EndTimeZone|Title|Desc|
 * 2016-12-18 09:00|GMT|2016-12-18 20:20|GST|Go to the mall|Buy some clothes|
 * 2016-12-18 22:45|GST|2016-12-19 03:40|IST|Go to the hairdresser|Look sharp|
 * 2017-01-07 17:00|IST|2017-01-07 18:15|GST|Go to the butcher|Kilo of beef|
 *
 *
 * And ends up like:
 *
 * [{
 *   description: Desc,
 *   end: {
 *     dateTime: End
 *     timeZone: EndTimeZone
 *   },
 *   start: {
 *     dateTime: Start
 *     timeZone: StartTimeZone
 *   },
 *   summary: Title
 * }]
 *
 *
 * @alias account.converterDefinition
 *
 */
method.converterDefinition = function(json,row,index){

  json["rowIndex"]=index;

  json["description"]=json["desc"];
  json["end"]={
    dateTime: json["End"],
    timeZone: json["EndTimeZone"],
  }
  json["start"]={
    dateTime: json["Start"],
    timeZone: json["StartTimeZone"],
  }
  json["summary"]=json["Title"];


  // Get rid of fields we don't want
  delete json["Start"];
  delete json["StartTimeZone"];
  delete json["End"];
  delete json["EndTimeZone"];
  delete json["Title"];
  delete json["Desc"];
};

/**
 * account.handleError
 *
 * @desc Logs the error and call back the parent
 *
 * @alias account.handleError
 *
 * @param  {string} err - Error string
 * @param  {callback} cb - The callback that handles the error response. Returns callback(errMsg)
 * @return {object} errMsg -
 */
method.handleError = function (err,cb) {
  var errMsg = "Account.js [" + this.name + "]: Error: " + err
  log.error(errMsg)
  cb(errMsg)
}


/**
 * account.process
 *
 * @desc Does the work for this account
 *
 * @alias account.process
 *
 * @param  {object} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the error response. Returns callback(errMsg)
 * @return {object} errMsg -
 */
method.process = function (params,cb) {

  var acc = this.name

  var self = this;

  /*
   * See if there is a notification
   */
  self._en.hasBeenProcessed(null, function(err, hasBeenProcessed) {

    if (err) { self.handleError(err,cb); return null }

    if (hasBeenProcessed) {
      log.info('[%s]: No email notification to be processed', acc)
      return null;

    } else {


      /*
       * Get the message contents
       */
      self._en.getMessage(null, function (err, msg) {

        if (err) { self.handleError(err,cb); return null }

	var body = msg.payload.body

        log.info('[%s]: Received body \n:%s', acc, body)


	/*
         * Convert the CSV to JSON
         */
        self._converter.fromString(body, function(err,result){
	  var errMsg = "Error converting CSV to JSON - " + err
          if (err) { self.handleError(errMsg,cb); return null }
        });

        // Create the calendar events
        // Label/trash the received message
        // Send out a completion report
      })
    }

  })

}



module.exports = Account
