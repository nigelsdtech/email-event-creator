'use strict'

var
    CalendarModel     = require('calendar-model'),
    chai              = require('chai'),
    cfg               = require('config'),
    GmailModel        = require('gmail-model'),
    Q                 = require('q')

require('q-foreach2')(Q);
chai.should();


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

// Mock failure reason for event creation failures
var evCreationFailureReason = "Test Fail"

/**
 * Check events have (or haven't) been inserted in to the calendar
 *
 * @param {object} params
 * @param {object[]} params.events - Event objects to be verified. Verification is finding an event with the same desc, start and end times
 * @param {boolean} params.events[i].shouldBeCreated - Indicates whether or not this event is expected to exist
 * @param {object} cb - Callback to be called at the end. Returns cb(err,isCreated)
 */ 
function checkEventsCreated (params,cb) {

  Q.foreach(params.events, function (ev, idx) {

    return Q.nfcall(calendar.listEvents,{
      retFields: ['items(end,start,summary)'],
      textSearch: ev.summary,
      timeMax: ev.end.dateTime
      timeMin: ev.start.dateTime
    })
    .then(function (evs) {

      var isCreated = false

      if (evs && evs.length > 0) {

        for (var i = 0; i < evs.length; i++) {
          var el = evs[i]
          if (el.summary = ev.summary && el.end.dateTime = ev.end.dateTime && el.end.startTime = ev.end.startTime) {
            isCreated = true
            break
          }
        }
      }

      isCreated.should.equal(ev.shouldBeCreated)
    })
  })
  .fail(function(err) { throw err })
  .fin(cb)
  .done()

}

/**
 * Check the report email has been received and contains the correct content
 *
 * @param {object} params
 * @param {object[]} params.events: JSON set of events expected in the report body
 * @param {object} cb - Callback to be called at the end. Returns cb(err,isCreated)
 */
function checkReport (params,cb) {

  var reportSubject = cfg.reporter.subjectSuccess

  var reportContents = "APP_NAME complete. NUM_SUCCESS events created successfully. NUM_FAILED failed."
  reportContents    += "<p>"

  // Prepare the event reports
  var succeededContents = ""
  var failedContents    = ""
  var numSucceeded      = 0
  var numFailed         = 0

  for (var i = 0; i < params.events.length; i++ ) {
    var e = params.events[i]
    if (e.shouldBeCreated == false) {
      failedContents += "Event: " + calendar.getEventString(e, {showTimeZones:true}) + "<br />"
      failedContents += "Reason: " + evCreationFailureReason + "<br /><br />"
      numFailed++
    } else {
      succeededContents += "Event: " + calendar.getEventString(e, {showTimeZones:true}) + "<br />"
      numSucceeded++
    }
  }

  Q.nfcall(personalGmail.listMessages,{
    freetextSearch: 'is:unread to:me newer_than:1d subject:"' + cfg.reporter.subjectSuccess + '"',
    maxResults: 1
  })
  .then(function (messages) { return Q.nfcall(workGmail.getMessage,{messageId: messages[0].id}) })
  .then(function (message) {

    var msgBody = message.body.data
    msgBody.should.equal(reportContents);
    cb();
  })

}

/**
 * Check that the email notification has been marked read and processed
 *
 * @param {object} params
 * @param {string} params.processedLabelId
 * @param {object} cb - Callback to be called at the end. Returns cb(err,isCreated)
 */
function checkTriggerUpdated (params,cb) {

  Q.nfcall(personalGmail.listMessages,{
    freetextSearch: 'is:unread to:me newer_than:1d subject:"' + cfg.notificationEmail.subject + '"',
    maxResults: 1
  })
  .then(function (messages) { return Q.nfcall(workGmail.getMessage,{messageId: messages[0].id}) })
  .then(function (message) {
    message.labelIds.should.include(params.processedLabelId);
    message.labelIds.should.not.include('UNREAD');
    cb();
  })

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
 * @returns {string} emailBody
 */ 
function createEmailBody (params) {

  var data = params.events

  var emailBody  = "Start|StartTimeZone|End|EndTimeZone|Title|Desc|"

  for (var i = 0; i < data.length; i++) {
    var d = data[i]
    emailBody += "\n" + d.start.dateTime + "|" + d.start.timeZone
    emailBody += "|"  + d.end.dateTime   + "|" + d.end.timeZone
    emailBody += "|"  + d.summary        + "|" + d.description + "|"
  }

  return emailBody
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
