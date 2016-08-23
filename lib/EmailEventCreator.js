"use strict"

var
    cfg               = require('config'),
    CalendarModel     = require('calendar-model'),
    Converter         = require('csvtojson').Converter,
    EmailNotification = require('email-notification'),
    GmailModel        = require('gmail-model'),
    log4js            = require('log4js'),
    Q                 = require('q'),
    reporter          = require('reporter');

require('q-foreach')(Q);


/*
 * Object variables
 */

var
    _calendar,
    _configurationComplete,
    _converter,
    _en,
    evsToCreate,
    log




/**
 * Setup the script params
 * @param {object}   params - Currently unused
 * @param {string}   cb - Calls this callback (optional)
 * @constructor
 */
function configure (params,cb) {

  if (_configurationComplete) { return null }

  // logs
  log4js.configure(cfg.log.log4jsConfigs);

  log = log4js.getLogger(cfg.log.appName);
  log.setLevel(cfg.log.level);

  log.info('Configuring')


  // Setup the notification checker
  _en = new EmailNotification(cfg.emailNotification);

  // Setup the google calendar
  _calendar = new CalendarModel({
    name:             cfg.account,
    calendarId:       'primary',
    clientSecretFile: cfg.auth.clientSecretFile,
    googleScopes:     cfg.auth.scopesCalendar,
    tokenDir:         cfg.auth.tokenFileDir,
    tokenFile:        cfg.auth.tokenFile,
    log4js:           log4js,
    logLevel:         cfg.log.level
  })

  // Setup the reporter
  reporter.configure(cfg.reporter)

  // Setup the converter
  _converter = new Converter({toArrayString: true});
  _converter.transform = converterDefinition


  _configurationComplete = true
  log.info('Configuration complete')

  if (cb) { cb() }
}


/*
 *
 * converterDefinition
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
function converterDefinition (json,row,index){

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
 * createFailureReport
 *
 * @desc Create a report of all failed creations
 *
 * @alias createFailureReport
 *
 * @return {string} HTML failure report
 */
function createFailureReport () {

    var report  = "Failed to create NUM_FAILED events."
        report += "<p>"

    var numFailed = 0

    evsToCreate.forEach( function (el, idx) {
      if (el.state == "rejected") {
        report +="Event [" + idx + "]: " + _calendar.getEventString(el.event)
        report +="<br>" + el.reason
        report +="-------"
        numFailed++
      }
    })

   report = report.replace("NUM_FAILED", numFailed)

   return report
}


/**
 * process
 *
 * @desc Does the work for this account
 *
 * @alias process
 *
 * @param  {object} params - Parameters for request (currently unused)
 * @param  {callback} callback - The callback that handles the error response. Returns callback(errMsg)
 * @return {object} errMsg -
 */
function process (params,cb) {

  var self = this;

  var cbErr = null

  // Initialize variables
  evsToCreate = []

  /*
   * See if there is a notification
   */
  Q.nfcall(_en.hasBeenProcessed)
  .then(function(hasBeenProcessed) {

    if (hasBeenProcessed) {
      log.info('No email notification to be processed')
      throw new Error('PROCESSING_NOT_REQUIRED')
    } else {
      return Q.nfcall(_en.getMessage, null)
    }

  })
  .then(function (msg) {

    // Get the message contents
    var body = msg.payload.body
    log.info('Received body \n:%s', body)

    // Convert the CSV to JSON
    return Q.nfcall(_converter.fromString, body)

  })
  .then(function(eventsJson) {
    // Create the calendar events
    log.info('Creating calendar event for %s events', eventsJson.length)

    // Create an array of promises for the creation of each event
    var ecas = []
    eventsJson.forEach(function (ev, idx) {
      log.info('--> [%s] Creating %s', idx, JSON.stringify(ev))
      evsToCreate.push({event: ev})
      ecas.push(Q.nfcall(_calendar.addEventToGoogle,ev))
    })

    return Q.allSettled(ecas)

  })
  .then( function (results) {

    log.info('Event creation results:')

    var numGood = 0,
        numBad  = 0;

    // Log out results of each attempt
    results.forEach(function (r,i) {

      evsToCreate[i].state = r.state

      log.info('[%s] %s', i, JSON.stringify(results))
      if (r.state == "fulfilled") {
          var evStr = _calendar.getEventString(r.value);
          log.info('Created event: ' + evStr)
          numGood++
      } else {
          var reason = r.reason;
          log.error('Failed to create event [%s]: %s', evsToCreate[i], reason)
          evsToCreate[i].reason = r.reason
          numBad++
      }
    });


    // For partial or whole success, we continue with the script
    if (numGood > 0) {

      // For partial failure, we fire off an error notice
      if (numBad > 0) {

        var report = createFailureReport()
        reporter.handleError({errMsg: report});

        return Q.resolve(null)

      } else {

        // No failures. Update the label
        return Q.nfcall(_en.updateLabels,{applyProcessedLabel: true,  markAsRead: true})
      }

    } else {
      // Complete failure
      var report = createFailureReport()
      return Q.reject(report)
    }


  })
  .then(function(updatedEmail) {

    // Send out a completion report
    log.info('Sending completion report')
    reporter.sendCompletionNotice({body: 'To be filled in'})
    log.info('Report invoked')
  })
  .fail(function (err) {

    if (err.message != "PROCESSING_NOT_REQUIRED") {
      log.error(err)
      reporter.handleError({errMsg: err});
      cbErr = err
    }
  })
  .fin(function () {
    cb(cbErr)
  })
  .done()


}



module.exports = function (cb) {


  configure()

  log.info('Begin script');
  log.info('============');

  log.info('Search criteria: %s', cfg.gmailSearchCriteria)

  _en.flushCache()

  process(cb)

}

module.exports.configure = configure
module.exports.createFailureReport = createFailureReport
module.exports.process = process
