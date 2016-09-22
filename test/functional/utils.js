'use strict'

var
    CalendarModel     = require('calendar-model'),
    cfg               = require('config'),
    GmailModel        = require('gmail-model'),
    Q                 = require('q')

require('q-foreach2')(Q);


/*
 * Various mail/calendar accounts
 */

// Test notification sender
var testerGmail = new gmailModel(cfg.test.testerGmail)

// Gmail of the main account
var gmail = new GmailModel(cfg.emailNotification)

// Calendar of the main account
var calendar = new CalendarModel({
    name:             cfg.account,
    calendarId:       'primary',
    clientSecretFile: cfg.auth.clientSecretFile,
    googleScopes:     cfg.auth.scopesCalendar,
    tokenDir:         cfg.auth.tokenFileDir,
    tokenFile:        cfg.auth.tokenFile
})


/**
 * Check events have been inserted in to the calendar
 *
 * @param {object} params
 * @param {object[]} params.events - Event objects to be verified. Verification is finding an event with the same desc, start and end times
 * @param {object} cb - Callback to be called at the end. Returns cb(err,isCreated)
 */ 
function checkCalenderEventsCreated (params,cb) {

  Q.foreach(params.events, function (ev idx) {
    var defer = Q.defer();

    return Q.nfcall(calendar.listEvents,{
      retFields: ['items(end,start,summary)'],
      textSearch: ev.summary,
      timeMax: ev.end.dateTime
      timeMin: ev.start.dateTime
    })
    .then(function (evs) { if (evs.length == 1) { return Q.resolve(true); } else { return Q.resolve(false); } })
    .done()

  })
  .then(function(results) {

    var ret = true

    // If all were created, we return true
    for (var i = 0; i < results.length; i++) {
      if (result.result == false) {
        ret = false
        break
      }
    }

    cb(null,ret)

  })
  .fail(function(err) { cb(err) })
  .done()

}

/**
 * Clean up the sent/received notification emails
 *
 * @param {object} params (currently unused)
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */
function cleanupEmails (params,cb) {

  var enSearchCriteria = 'to:' + cfg.test.notificationTo + ' subject: ' + cfg.emailNotification.subject

  // Get rid of the message sent by the sender
  Q.allSettled([
    Q.nfcall(testerGmail.listMessages, { freetextSearch: enSearchCriteria }),
    Q.nfcall(gmail.listMessages,       { freetextSearch: enSearchCriteria })
  ])
  .spread(function(senderMessages,recipientMessages) {

    var trashJobs = []

    // Add the sender's messages to the list of trash jobs
    if (senderMessages) {
      senderMessages.foreach(function (el) {
        trashJobs.push(Q.nfcall(testerGmail.trashMessages,{messageIds: [el.id]}))
      })
    }

    // Add the recipients messages to the list of trash jobs
    if (recipientMessages) {
      recipientMessages.foreach(function (el) {
        trashJobs.push(Q.nfcall(gmail.trashMessages,{messageIds: [el.id]}))
      })
    }

    if (trashJobs.length > 0) {
      return Q.allSettled(trashJobs)
    } else {
      Q.resolve(null)
    }
  })
  .then(function() { cb() })
  .fail(function(err) { cb(err) })
  .done()


}

/**
 * Create email body from json events
 *
 * @param {object} params
 * @param {object[]} params.events - Event objects.
 * @param {object} cb - Callback to be called at the end. Returns cb(err,emailBody)
 */ 
function createEmailBody (params,cb) {

  var data = params.events

  var emailBody  = "Start|StartTimeZone|End|EndTimeZone|Title|Desc|"

  for (var i = 0; i < data.length; i++) {
    var d = data[i]
    emailBody += "\n" + d.start.dateTime + "|" + d.start.timeZone
    emailBody += "|"  + d.end.dateTime   + "|" + d.end.timeZone
    emailBody += "|"  + d.summary        + "|" + d.description + "|"
  }

  cb(null,emailBody)
}

/**
 * Sends a mock notification email
 *
 * @param {object} params
 * @param {string} params.body - email body
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */
function sendNotificationEmail (params, cb) {

  personalGmail.sendMessage({
    body: params.body
    subject: cfg.emailNotification.subject
    to: cfg.test.notificationTo
  }, function (err, cb) {
    cb(err)
  })

}

/**
 * Main script run
 *
 * @param {object} params (currently unused)
 * @param {object} cb - Callback to be called at the end. Returns cb(err)
 */
function runMainScript (params,cb) {

  Q.nfcall(account)
  .then(function(empty){ cb(null) })
  .fail(function(err)  { cb(err) })
  .done()

}
